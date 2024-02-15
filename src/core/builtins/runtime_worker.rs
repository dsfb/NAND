use crate::{architecture::ticktock, builtins::hardware::PRESSED_KEY};
use serde::Serialize;
use wasm_bindgen::prelude::*;
use web_sys::DedicatedWorkerGlobalScope;

#[derive(Serialize)]
#[serde(tag = "action", rename = "stoppedRuntime")]
pub struct StopRuntimeMessage {}

pub static mut IN_RUNTIME_LOOP: bool = false;
pub static mut STOP_RUNTIME_LOOP: bool = false;
pub static mut LOAD_NEW_PROGRAM: bool = false;
pub static mut READY_TO_LOAD_NEW_PROGRAM: bool = false;
pub static mut EMIT_INTERVAL_STEP_TOTAL: usize = 0;

// adjust accordingly
// lowest value until the Hz starts to drop
// we want the lowest so the keyboard is faster
pub const MAX_STEPS_PER_LOOP: usize = 30_000;
pub const MIN_STEPS_PER_LOOP: usize = 1;
pub static mut STEPS_PER_LOOP: usize = MAX_STEPS_PER_LOOP;

#[wasm_bindgen(js_name = startRuntime)]
pub fn start() {
    unsafe {
        if IN_RUNTIME_LOOP {
            return;
        }
        IN_RUNTIME_LOOP = true;
    }
    loop {
        if std::hint::black_box(unsafe { LOAD_NEW_PROGRAM }) {
            unsafe {
                READY_TO_LOAD_NEW_PROGRAM = true;
            }
            continue;
        }
        for _ in 0..unsafe { STEPS_PER_LOOP } {
            ticktock();
        }
        unsafe {
            EMIT_INTERVAL_STEP_TOTAL += STEPS_PER_LOOP;
            if PRESSED_KEY == 32767 {
                PRESSED_KEY = 0;
                let _ = js_sys::global()
                    .unchecked_into::<DedicatedWorkerGlobalScope>()
                    .post_message(&serde_wasm_bindgen::to_value(&StopRuntimeMessage {}).unwrap());
                break;
            }
            if STOP_RUNTIME_LOOP {
                STOP_RUNTIME_LOOP = false;
                break;
            }
        }
    }
    unsafe {
        IN_RUNTIME_LOOP = false;
    }
}
