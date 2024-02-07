use crate::builtins::hardware;
use std::{cell::RefCell, rc::Rc};
use wasm_bindgen::prelude::*;
use web_sys::DedicatedWorkerGlobalScope;

#[wasm_bindgen]
pub fn screen_init(ctx: hardware::OffscreenCanvasRenderingContext2d) {
    unsafe { hardware::CTX = Some(ctx) };
}

#[wasm_bindgen]
pub fn screen_handle_message(msg: &str) {
    match msg {
        "startRendering" => start_rendering(),
        "stopRendering" => stop_rendering(),
        _ => unreachable!(),
    }
}

static mut STOP_RENDERING_LOOP: bool = false;
static mut CURRENTLY_RENDERING: bool = false;
fn start_rendering() {
    // We need this sort of locking mechanism because of the case of resetAndStart
    // *sometimes* we want to start rendering, and sometimes we don't want to do
    // anything because it's already rendering. So, instead of moving the logic
    // to prevent double rendering to the app logic, we can just do it here to
    // make it such that it still works even if multiple startRendering messages
    // are sent
    if unsafe { CURRENTLY_RENDERING } {
        return;
    }
    unsafe {
        CURRENTLY_RENDERING = true;
    }
    // https://rustwasm.github.io/wasm-bindgen/examples/request-animation-frame.html
    let f = Rc::new(RefCell::new(None::<Closure<dyn FnMut()>>));
    let g = f.clone();

    *g.borrow_mut() = Some(Closure::new(move || {
        if unsafe { STOP_RENDERING_LOOP } {
            unsafe {
                STOP_RENDERING_LOOP = false;
            }
        } else {
            let _ = js_sys::global()
                .unchecked_into::<DedicatedWorkerGlobalScope>()
                .request_animation_frame(f.borrow().as_ref().unwrap().as_ref().unchecked_ref());
        }
        hardware::render();
    }));
    let _ = js_sys::global()
        .unchecked_into::<DedicatedWorkerGlobalScope>()
        .request_animation_frame(g.borrow().as_ref().unwrap().as_ref().unchecked_ref());
}

fn stop_rendering() {
    unsafe {
        if CURRENTLY_RENDERING {
            STOP_RENDERING_LOOP = true;
            CURRENTLY_RENDERING = false;
        }
    }
}