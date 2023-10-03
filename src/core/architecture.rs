use wasm_bindgen::prelude::wasm_bindgen;

use crate::{pc_reg, gates::{mux16, and, is_zero, or, not}, arithmetic::{inc16, alu}, nbit16, aregister, slice16_0to14, dregister, screen, slice16_0to12, rom32k, tick, tock, ram16k, keyboard, u16_from_bool, bool_from_u16};

static mut PC_DFFOUT: u16 = 0;
fn pc(in_: u16, load: bool, reset: bool) -> u16 {
    unsafe { PC_DFFOUT = pc_reg(
        // reset
        mux16(
            // load
            mux16(
                // inc
                inc16(PC_DFFOUT),
                in_,
                load
            ),
            0,
            reset
        )
    )};
    unsafe { PC_DFFOUT }
}

static mut CPU_DFFOUT: [u16; 4] = [0; 4];
pub fn cpu(in_m: u16, instruction: u16, reset: bool) {
    unsafe { CPU_DFFOUT[1] = u16_from_bool(and(nbit16(instruction, 3), nbit16(instruction, 15))) };
    
    let aluy1 = aregister(0, false);

    unsafe { CPU_DFFOUT[2] = slice16_0to14(aluy1) };

    unsafe { CPU_DFFOUT[3] = pc(slice16_0to14(aluy1), false, reset) };

    let aluout = alu(
        dregister(0, false),
        mux16(aluy1, in_m, nbit16(instruction, 12)),
        nbit16(instruction, 11),
        nbit16(instruction, 10),
        nbit16(instruction, 9),
        nbit16(instruction, 8),
        nbit16(instruction, 7),
        nbit16(instruction, 6),
    );

    unsafe { CPU_DFFOUT[0] = aluout };

    let aluoutiszero = is_zero(aluout);

    dregister(
        aluout,
        and(nbit16(instruction, 4), nbit16(instruction, 15))
    );
    pc(
        slice16_0to14(
            aregister(
                mux16(instruction, aluout, nbit16(instruction, 15)),
                or(not(nbit16(instruction, 15)), nbit16(instruction, 5))
            )
        ),
        and(
            or(or(
                and(not(or(nbit16(aluout, 15), aluoutiszero)), nbit16(instruction, 0)), // positive
                and(aluoutiszero, nbit16(instruction, 1))),
                and(nbit16(aluout, 15), nbit16(instruction, 2))
            ),
            nbit16(instruction, 15)
        ),
        reset
    );
}

fn memory(in_: u16, load: bool, address: u16) -> u16 {
    // address[14] == 0 means select RAM
    // address[13] == 0 means select Screen
    // address[13] == 1 and address[14] == 1 means select Keyboard
    // 00 => RAM
    // 01 => RAM
    // 10 => SCREEN
    // 11 => KEYBOARD

    mux16(
        ram16k(
            in_,
            and(
                not(nbit16(address, 14)),
                load
            ),
            address,
        ),
        mux16(
            screen(
                in_,
                and(and(
                    not(nbit16(address, 13)),
                    nbit16(address, 14)),
                    load
                ),
                slice16_0to12(address)
            ),
            keyboard(false, 0),
            nbit16(address, 13)
        ),
        nbit16(address, 14)
    )
}

fn computer(reset: bool) {
    cpu(
        memory(0, false, unsafe { CPU_DFFOUT[2] }),
        rom32k(unsafe { CPU_DFFOUT[3] }),
        reset
    );
    memory(unsafe { CPU_DFFOUT[0] }, bool_from_u16(unsafe { CPU_DFFOUT[1] }), unsafe { CPU_DFFOUT[2] });
}

#[wasm_bindgen]
pub fn ticktock(reset: bool) {
    tick();
    computer(reset);
    tock();
    computer(reset);
}