use crate::{
    architecture,
    builtins::{hardware, runtime_worker, utils::js_api},
};

pub fn try_stop_and_reset_blocking() {
    if unsafe { *runtime_worker::IN_RUNTIME_LOOP.get() } {
        unsafe {
            *runtime_worker::STOP_RUNTIME_LOOP.get() = true;
        }
        while std::hint::black_box(unsafe { *runtime_worker::IN_RUNTIME_LOOP.get() }) {}
    }
    architecture::reset();
}

pub fn reset_blocking_and_partial_start(machine_code: Vec<String>) {
    let machine_code_buf = machine_code
        .into_iter()
        .map(|v| u16::from_str_radix(v.as_str(), 2).unwrap())
        .collect::<Vec<u16>>();
    unsafe {
        *runtime_worker::LOADING_NEW_PROGRAM.get() = true;
    }
    while std::hint::black_box(unsafe { !*runtime_worker::READY_TO_LOAD_NEW_PROGRAM.get() }) {}
    hardware::load_rom(machine_code_buf);
    architecture::reset();
    unsafe {
        *runtime_worker::LOADING_NEW_PROGRAM.get() = false;
        *runtime_worker::READY_TO_LOAD_NEW_PROGRAM.get() = false;
    }
}

pub fn try_stop() {
    if unsafe { *runtime_worker::IN_RUNTIME_LOOP.get() } {
        unsafe {
            *runtime_worker::STOP_RUNTIME_LOOP.get() = true;
        }
        js_api::post_worker_message(runtime_worker::StoppedRuntimeMessage {});
    }
}

pub fn speed(speed_percentage: u16) {
    let min_log_value = (runtime_worker::MIN_STEPS_PER_LOOP as f64).log10();
    let max_log_value = (runtime_worker::MAX_STEPS_PER_LOOP as f64).log10();
    let log_scaled_value =
        min_log_value + (speed_percentage as f64 / 100.0) * (max_log_value - min_log_value);
    unsafe {
        *runtime_worker::STEPS_PER_LOOP.get() = 10.0_f64.powf(log_scaled_value) as usize;
    }
}
