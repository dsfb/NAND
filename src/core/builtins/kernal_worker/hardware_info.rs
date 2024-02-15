use crate::builtins::{
    hardware,
    memory::{RAM16K_MEMORY, SCREEN_MEMORY},
    runtime_worker::EMIT_INTERVAL_STEP_TOTAL,
};
use js_sys::Uint16Array;
use serde::Serialize;
use std::{cell::LazyCell, collections::VecDeque};
use wasm_bindgen::{closure::Closure, JsCast};
use web_sys::{DedicatedWorkerGlobalScope, WorkerGlobalScope};

static mut EMIT_HARDWARE_INFO_INTERVAL: Option<i32> = None;
pub static mut EMIT_HARDWARE_INFO_CLOSURE: LazyCell<Closure<dyn Fn()>> =
    LazyCell::new(|| Closure::new(emit));

#[derive(Serialize)]
#[serde(tag = "action", rename = "hardwareInfo")]
struct HardwareInfoMessage {
    hz: f64,
    #[serde(rename = "NANDCalls")]
    nand_calls: u64,
}

impl Default for HardwareInfoMessage {
    fn default() -> Self {
        Self {
            hz: 0.0,
            nand_calls: 0,
        }
    }
}

#[derive(Serialize)]
struct MemoryMessage {
    action: &'static str,
    #[serde(with = "serde_wasm_bindgen::preserve", rename = "ramMemory")]
    ram_memory: Uint16Array,
    #[serde(with = "serde_wasm_bindgen::preserve", rename = "screenMemory")]
    screen_memory: Uint16Array,
    #[serde(rename = "pressedKey")]
    pressed_key: u16,
}

static mut PREV_SEC_TOTALS: VecDeque<f64> = VecDeque::new();
static mut PREV_EMIT_HARDWARE_INFO_TIMESTAMP: Option<f64> = None;
static mut EMIT_MEMORY_COUNTER: usize = 0;
const EMIT_HARDWARE_INFO_INTERVAL_DELAY: usize = 50;
const PREV_SEC_TOTAL_AVG_TIME: usize = 1;

pub fn start_emitting() {
    let emit_hardware_info_interval = js_sys::global()
        .unchecked_into::<DedicatedWorkerGlobalScope>()
        .set_interval_with_callback_and_timeout_and_arguments_0(
            unsafe { EMIT_HARDWARE_INFO_CLOSURE.as_ref().unchecked_ref() },
            EMIT_HARDWARE_INFO_INTERVAL_DELAY as i32,
        )
        .unwrap();
    let prev_emit_hardware_info_timestamp = js_sys::global()
        .dyn_into::<WorkerGlobalScope>()
        .unwrap()
        .performance()
        .unwrap()
        .now();
    unsafe {
        EMIT_HARDWARE_INFO_INTERVAL = Some(emit_hardware_info_interval);
        PREV_EMIT_HARDWARE_INFO_TIMESTAMP = Some(prev_emit_hardware_info_timestamp);
    }
}

pub fn reset() {
    unsafe {
        EMIT_INTERVAL_STEP_TOTAL = 0;
        PREV_SEC_TOTALS.clear();
    }
}

pub fn stop_emitting() {
    let Some(emit_info_interval) = (unsafe { EMIT_HARDWARE_INFO_INTERVAL }) else {
        return;
    };
    js_sys::global()
        .unchecked_into::<DedicatedWorkerGlobalScope>()
        .clear_interval_with_handle(emit_info_interval);
    unsafe {
        EMIT_HARDWARE_INFO_INTERVAL = None;
    }
}

pub fn emit() {
    let current_emit = js_sys::global()
        .dyn_into::<WorkerGlobalScope>()
        .unwrap()
        .performance()
        .unwrap()
        .now();
    unsafe {
        if PREV_SEC_TOTALS.len()
            == (1000 * PREV_SEC_TOTAL_AVG_TIME) / EMIT_HARDWARE_INFO_INTERVAL_DELAY
        {
            PREV_SEC_TOTALS.pop_front();
        }
        PREV_SEC_TOTALS.push_back(
            EMIT_INTERVAL_STEP_TOTAL as f64
                / (current_emit - PREV_EMIT_HARDWARE_INFO_TIMESTAMP.unwrap())
                * 1000.0,
        );
        PREV_EMIT_HARDWARE_INFO_TIMESTAMP = Some(current_emit);
        EMIT_INTERVAL_STEP_TOTAL = 0;
    };
    let _ = js_sys::global()
        .unchecked_into::<DedicatedWorkerGlobalScope>()
        .post_message(
            &serde_wasm_bindgen::to_value(&HardwareInfoMessage {
                hz: unsafe { PREV_SEC_TOTALS.iter().sum::<f64>() / PREV_SEC_TOTALS.len() as f64 },
                nand_calls: hardware::nand_calls(),
            })
            .unwrap(),
        );
    if unsafe { EMIT_MEMORY_COUNTER } == 1000 / EMIT_HARDWARE_INFO_INTERVAL_DELAY {
        unsafe {
            EMIT_MEMORY_COUNTER = 0;
        }
        let _ = js_sys::global()
            .unchecked_into::<DedicatedWorkerGlobalScope>()
            .post_message(
                &serde_wasm_bindgen::to_value(&MemoryMessage {
                    action: "emitMemory",
                    ram_memory: unsafe { Uint16Array::view(RAM16K_MEMORY.as_slice()) },
                    screen_memory: unsafe { Uint16Array::view(SCREEN_MEMORY.as_slice()) },
                    pressed_key: unsafe { hardware::PRESSED_KEY },
                })
                .unwrap(),
            );
    } else {
        unsafe {
            EMIT_MEMORY_COUNTER += 1;
        }
    };
}
