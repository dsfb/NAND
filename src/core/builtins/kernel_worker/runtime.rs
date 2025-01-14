use super::{KeyboardMessage, ResetAndPartialStartMessage, SpeedMessage};
use crate::architecture;
use crate::builtins::utils::js_api;
use crate::builtins::{hardware, runtime_worker};
use std::ptr;

pub fn try_stop_and_reset_blocking() {
    if runtime_worker::in_runtime_loop() {
        unsafe {
            *runtime_worker::STOP_RUNTIME_LOOP.get() = true;
        }
        while runtime_worker::in_runtime_loop_volatile() {}
    }
    architecture::reset();
}

pub fn reset_blocking_and_partial_start(
    reset_and_partial_start_message: ResetAndPartialStartMessage,
) {
    let machine_code = reset_and_partial_start_message
        .machine_code
        .into_iter()
        .map(|v| u16::from_str_radix(v.as_str(), 2).unwrap())
        .collect::<Vec<u16>>();
    unsafe {
        *runtime_worker::LOADING_NEW_PROGRAM.get() = true;
    }
    // read_volatile is absolutely needed here to prevent the compiler from optimizing the loop away
    // see https://godbolt.org/z/xq7P8PEj4 for the full story
    while unsafe { !ptr::read_volatile(runtime_worker::READY_TO_LOAD_NEW_PROGRAM.get()) } {}
    hardware::load_rom(machine_code.as_slice());
    architecture::reset();
    unsafe {
        *runtime_worker::LOADING_NEW_PROGRAM.get() = false;
        *runtime_worker::READY_TO_LOAD_NEW_PROGRAM.get() = false;
    }
}

pub fn try_stop() {
    if runtime_worker::in_runtime_loop() {
        unsafe {
            *runtime_worker::STOP_RUNTIME_LOOP.get() = true;
        }
        js_api::post_worker_message(runtime_worker::StoppedRuntimeMessage {});
    }
}

pub const ALL_STEPS_PER_LOOP: [usize; 11] =
    [1, 10, 500, 2000, 8000, 15000, 22500, 29250, 29500, 29750, 30000];

pub fn speed(speed_message: SpeedMessage) {
    let speed_percentage = speed_message.speed_percentage;
    let div = (speed_percentage as usize) / 10;
    if div == 10 {
        unsafe {
            *runtime_worker::STEPS_PER_LOOP.get() = ALL_STEPS_PER_LOOP[10];
        }
    } else {
        let div_speed = ALL_STEPS_PER_LOOP[div];
        let next_div_speed = ALL_STEPS_PER_LOOP[div + 1];
        let lerp = (speed_percentage as usize) % 10;
        unsafe {
            *runtime_worker::STEPS_PER_LOOP.get() =
                div_speed + ((next_div_speed - div_speed) * lerp) / 10;
        }
    };
}

pub fn keyboard(keyboard_message: KeyboardMessage) {
    hardware::keyboard(keyboard_message.key, true);
}
