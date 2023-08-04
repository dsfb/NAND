import { ALU, Inc16 } from "./arithmetic";
import { ARegister, DRegister, Keyboard, PC_reg, RAM16K, ROM32K, Screen, nBit16, slice16_0to12, slice16_0to13, slice16_0to14, slice16_13to14 } from "./builtins";
import { And, Mux16, Mux4Way16, Not, Or, isZero } from "./gates";

// a vanilla RAM16K design is too slow so we *must* emulate it (in builitins) :(

/*
class DFF {
    private prev: boolean = false;
    public call(in_: boolean): boolean {
        const out = this.prev;
        if (clock) {
            this.prev = in_;
        }
        return out;
    }
}

class Bit {
    private dffout: boolean = false;
    private dff: DFF = new DFF();
    public call(in_: boolean, load: boolean): boolean {
        return this.dffout = this.dff.call(Mux(this.dffout, in_, load));
    }
}

class Register {
    private bits_0: Bit = new Bit();
    private bits_1: Bit = new Bit();
    private bits_2: Bit = new Bit();
    private bits_3: Bit = new Bit();
    private bits_4: Bit = new Bit();
    private bits_5: Bit = new Bit();
    private bits_6: Bit = new Bit();
    private bits_7: Bit = new Bit();
    private bits_8: Bit = new Bit();
    private bits_9: Bit = new Bit();
    private bits_10: Bit = new Bit();
    private bits_11: Bit = new Bit();
    private bits_12: Bit = new Bit();
    private bits_13: Bit = new Bit();
    private bits_14: Bit = new Bit();
    private bits_15: Bit = new Bit();
    public call(in_: u16, load: boolean): u16 {
        return word16_16(
            this.bits_0.call(nBit16(in_, 0), load),
            this.bits_1.call(nBit16(in_, 1), load),
            this.bits_2.call(nBit16(in_, 2), load),
            this.bits_3.call(nBit16(in_, 3), load),
            this.bits_4.call(nBit16(in_, 4), load),
            this.bits_5.call(nBit16(in_, 5), load),
            this.bits_6.call(nBit16(in_, 6), load),
            this.bits_7.call(nBit16(in_, 7), load),
            this.bits_8.call(nBit16(in_, 8), load),
            this.bits_9.call(nBit16(in_, 9), load),
            this.bits_10.call(nBit16(in_, 10), load),
            this.bits_11.call(nBit16(in_, 11), load),
            this.bits_12.call(nBit16(in_, 12), load),
            this.bits_13.call(nBit16(in_, 13), load),
            this.bits_14.call(nBit16(in_, 14), load),
            this.bits_15.call(nBit16(in_, 15), load),
        );
    }
    // For CPU debugging:
    // public toString(): u16 {
    //     return word16_16(
    //         this.bits_0.dff.prev,
    //         this.bits_1.dff.prev,
    //         this.bits_2.dff.prev,
    //         this.bits_3.dff.prev,
    //         this.bits_4.dff.prev,
    //         this.bits_5.dff.prev,
    //         this.bits_6.dff.prev,
    //         this.bits_7.dff.prev,
    //         this.bits_8.dff.prev,
    //         this.bits_9.dff.prev,
    //         this.bits_10.dff.prev,
    //         this.bits_11.dff.prev,
    //         this.bits_12.dff.prev,
    //         this.bits_13.dff.prev,
    //         this.bits_14.dff.prev,
    //         this.bits_15.dff.prev,
    //     );
    // }
}

class RAM8 {
    private registers_0: Register = new Register();
    private registers_1: Register = new Register();
    private registers_2: Register = new Register();
    private registers_3: Register = new Register();
    private registers_4: Register = new Register();
    private registers_5: Register = new Register();
    private registers_6: Register = new Register();
    private registers_7: Register = new Register();
    public call(in_: u16, load: boolean, address: u8): u16 {
        const selector = DMux8Way(load, address);
        return Mux8Way16(
            this.registers_0.call(in_, nBit16(selector, 0)),
            this.registers_1.call(in_, nBit16(selector, 1)),
            this.registers_2.call(in_, nBit16(selector, 2)),
            this.registers_3.call(in_, nBit16(selector, 3)),
            this.registers_4.call(in_, nBit16(selector, 4)),
            this.registers_5.call(in_, nBit16(selector, 5)),
            this.registers_6.call(in_, nBit16(selector, 6)),
            this.registers_7.call(in_, nBit16(selector, 7)),
            address
        )
    }
}

class RAM64 {
    private RAM8s_0: RAM8 = new RAM8();
    private RAM8s_1: RAM8 = new RAM8();
    private RAM8s_2: RAM8 = new RAM8();
    private RAM8s_3: RAM8 = new RAM8();
    private RAM8s_4: RAM8 = new RAM8();
    private RAM8s_5: RAM8 = new RAM8();
    private RAM8s_6: RAM8 = new RAM8();
    private RAM8s_7: RAM8 = new RAM8();
    public call(in_: u16, load: boolean, address: u8): u16 {
        const selectoraddress = slice8_3to5(address);
        const selector = DMux8Way(load, selectoraddress);
        const ramaddress = slice8_0to2(address);
        return Mux8Way16(
            this.RAM8s_0.call(in_, nBit16(selector, 0), ramaddress),
            this.RAM8s_1.call(in_, nBit16(selector, 1), ramaddress),
            this.RAM8s_2.call(in_, nBit16(selector, 2), ramaddress),
            this.RAM8s_3.call(in_, nBit16(selector, 3), ramaddress),
            this.RAM8s_4.call(in_, nBit16(selector, 4), ramaddress),
            this.RAM8s_5.call(in_, nBit16(selector, 5), ramaddress),
            this.RAM8s_6.call(in_, nBit16(selector, 6), ramaddress),
            this.RAM8s_7.call(in_, nBit16(selector, 7), ramaddress),
            selectoraddress,
        )
    }
}

class RAM512 {
    private RAM64s_0: RAM64 = new RAM64();
    private RAM64s_1: RAM64 = new RAM64();
    private RAM64s_2: RAM64 = new RAM64();
    private RAM64s_3: RAM64 = new RAM64();
    private RAM64s_4: RAM64 = new RAM64();
    private RAM64s_5: RAM64 = new RAM64();
    private RAM64s_6: RAM64 = new RAM64();
    private RAM64s_7: RAM64 = new RAM64();
    public call(in_: u16, load: boolean, address: u16): u16 {
        const selectoraddress = slice16_6to8(address);
        const selector = DMux8Way(load, selectoraddress);
        const ramaddress = slice16_0to5(address);
        return Mux8Way16(
            this.RAM64s_0.call(in_, nBit16(selector, 0), ramaddress),
            this.RAM64s_1.call(in_, nBit16(selector, 1), ramaddress),
            this.RAM64s_2.call(in_, nBit16(selector, 2), ramaddress),
            this.RAM64s_3.call(in_, nBit16(selector, 3), ramaddress),
            this.RAM64s_4.call(in_, nBit16(selector, 4), ramaddress),
            this.RAM64s_5.call(in_, nBit16(selector, 5), ramaddress),
            this.RAM64s_6.call(in_, nBit16(selector, 6), ramaddress),
            this.RAM64s_7.call(in_, nBit16(selector, 7), ramaddress),
            selectoraddress,
        )
    }
}

class RAM4K {
    private RAM512s_0: RAM512 = new RAM512();
    private RAM512s_1: RAM512 = new RAM512();
    private RAM512s_2: RAM512 = new RAM512();
    private RAM512s_3: RAM512 = new RAM512();
    private RAM512s_4: RAM512 = new RAM512();
    private RAM512s_5: RAM512 = new RAM512();
    private RAM512s_6: RAM512 = new RAM512();
    private RAM512s_7: RAM512 = new RAM512();
    // @ts-ignore
    @inline
    public call(in_: u16, load: boolean, address: u16): u16 {
        const selectoraddress = slice16_9to11(address);
        const selector = DMux8Way(load, selectoraddress);
        const ramaddress = slice16_0to8(address);
        return Mux8Way16(
            this.RAM512s_0.call(in_, nBit16(selector, 0), ramaddress),
            this.RAM512s_1.call(in_, nBit16(selector, 1), ramaddress),
            this.RAM512s_2.call(in_, nBit16(selector, 2), ramaddress),
            this.RAM512s_3.call(in_, nBit16(selector, 3), ramaddress),
            this.RAM512s_4.call(in_, nBit16(selector, 4), ramaddress),
            this.RAM512s_5.call(in_, nBit16(selector, 5), ramaddress),
            this.RAM512s_6.call(in_, nBit16(selector, 6), ramaddress),
            this.RAM512s_7.call(in_, nBit16(selector, 7), ramaddress),
            selectoraddress,
        )
    }
}

const RAM4Ks_0 = new RAM4K();
const RAM4Ks_1 = new RAM4K();
const RAM4Ks_2 = new RAM4K();
const RAM4Ks_3 = new RAM4K();

// @ts-ignore
@inline
export function RAM16K(in_: u16, load: boolean, address: u16): u16 {
    const selectoraddress = slice16_12to13(address);
    const selector = DMux4Way(load, selectoraddress);
    const ramaddress = slice16_0to11(address);
    return Mux4Way16(
        RAM4Ks_0.call(in_, nBit16(selector, 0), ramaddress),
        RAM4Ks_1.call(in_, nBit16(selector, 1), ramaddress),
        RAM4Ks_2.call(in_, nBit16(selector, 2), ramaddress),
        RAM4Ks_3.call(in_, nBit16(selector, 3), ramaddress),
        selectoraddress,
    );
}
*/

let PC_dffout: u16 = 0;
// @ts-ignore
@inline
function PC(in_: u16, load: boolean, reset: boolean): u16 {
    return PC_dffout = PC_reg(
        // reset
        Mux16(
            // load
            Mux16(
                // inc
                Inc16(PC_dffout),
                in_,
                load
            ),
            0,
            reset
        )
    );
}

let ALUout: u16 = 0;
let ALUoutisneg: boolean = false;
let AlUoutiszero: boolean = true;
let ALUoutispos: boolean = false;

const out = new StaticArray<u16>(4);

// NOTE: CPU has been heavily optimized and thus obfuscated too
// Please look at c57782a for a more verbose implementation of CPU

// @ts-ignore
@inline
export function CPU(inM: u16, instruction: u16, reset: boolean): StaticArray<u16> {
    const instruction0 = nBit16(instruction, 0);
    const instruction1 = nBit16(instruction, 1);
    const instruction2 = nBit16(instruction, 2);
    const instruction5 = nBit16(instruction, 5);
    const instruction15 = nBit16(instruction, 15);
    const notinstruction15 = Not(instruction15);

    // @ts-ignore
    // writeM
    out[1] = <u16>And(nBit16(instruction, 3), instruction15);
    
    const ALUy1 = ARegister(
        Mux16(instruction, ALUout, instruction15),
        false,
    );
    const PCin = slice16_0to14(ALUy1);

    // addressM
    out[2] = PCin;

    // pc
    out[3] = PC(
        PCin,
        And(
            Or(
                Or(
                    And(ALUoutispos, instruction0),
                    And(AlUoutiszero, instruction1),
                ),
                And(ALUoutisneg, instruction2)
            ),
            instruction15
        ),
        reset
    );

    // outM
    out[0] = ALUout = ALU(
        DRegister(ALUout, false),
        Mux16(ALUy1, inM, nBit16(instruction, 12)),
        nBit16(instruction, 11),
        nBit16(instruction, 10),
        nBit16(instruction, 9),
        nBit16(instruction, 8),
        nBit16(instruction, 7),
        nBit16(instruction, 6),
    );

    ALUoutisneg = nBit16(ALUout, 15);
    AlUoutiszero = isZero(ALUout);
    ALUoutispos = Not(Or(ALUoutisneg, AlUoutiszero));

    DRegister(
        ALUout,
        And(nBit16(instruction, 4), instruction15)
    );
    PC(
        slice16_0to14(
            ARegister(
                Mux16(instruction, ALUout, instruction15),
                Or(notinstruction15, instruction5)
            )
        ),
        And(
            Or(
                Or(
                    And(ALUoutispos, instruction0),
                    And(AlUoutiszero, instruction1)
                ),
                And(ALUoutisneg, instruction2)
            ),
            instruction15
        ),
        reset
    );
    return out;
}

// @ts-ignore
@inline
function Memory(in_: u16, load: boolean, address: u16): u16 {
    // address[14] == 0 means select RAM
    // address[13] == 0 means select Screen
    // address[13] == 1 and address[14] == 1 means select Keyboard
    // 00 => RAM
    // 01 => RAM
    // 10 => SCREEN
    // 11 => KEYBOARD

    const address14 = nBit16(address, 14);
    const out1 = RAM16K(
        in_,
        And(
            Not(address14),
            load
        ),
        slice16_0to13(address)
    );
    return Mux4Way16(
        out1,
        out1,
        Screen(
            in_,
            And(
                And(
                    Not(nBit16(address, 13)),
                    address14
                ),
                load
            ),
            slice16_0to12(address)
        ),
        Keyboard(),
        slice16_13to14(address),
    );
}

let CPUout: StaticArray<u16> = [0, 0, 0, 0];
export function Computer(reset: boolean): void {
    CPUout = CPU(
        // @ts-ignore
        Memory(CPUout[0], <boolean>CPUout[1], CPUout[2]),
        ROM32K(CPUout[3]),
        reset
    );
}