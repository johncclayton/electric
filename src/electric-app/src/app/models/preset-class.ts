import * as _ from 'lodash';
import {iChargerService} from '../services/icharger.service';

export enum ChemistryType {
    LiPo = 0,
    LiLo,
    LiFe,
    NiMH,
    NiCd,
    Pb,
    NiZn,
    Anything,
}

export enum LipoBalanceType {
    Slow = 0,
    Normal = 1,
    Fast = 2,
    User = 3,
    // only returned when li_mode_c is 1
    DontBalance = 4
}

// li_balance_end_mode
export enum BalanceEndCondition {
    // Charge End Current is disabled in the UI
    EndCurrentOff_DetectBalanceOn,

    // Charge End Current enabled for all remaining options,
    EndCurrentOn_DetectBalanceOff,
    EndCurrent_or_DetectBalance,
    EndCurrent_and_DetectBalance,
}

// Yes, it's not sequential as per the iCharger UI itself.
export enum RegenerativeMode {
    Off = 0,
    ToInput = 1,
    ToChannel = 2
}

export enum RegenerativeToChannelMethod {
    ResistanceOrBulbs = 0,
    ChargingBattery = 1,
}

export enum Cycle {
    ChargeDischarge,
    DischargeCharge,
    ChargeDischargeCharge,
    DischargeChargeDischarge,
    ChargeDischargeStore,
    DischargeChargeStore,
}

let _dischargeVoltageMinMax: Map<ChemistryType, Array<{ min: number, max: number }>> = new Map();
_dischargeVoltageMinMax[ChemistryType.LiPo] = {'min': 3.0, 'max': 4.1};
_dischargeVoltageMinMax[ChemistryType.LiFe] = {'min': 2.0, 'max': 3.5};
_dischargeVoltageMinMax[ChemistryType.NiMH] = {'min': 0.1, 'max': 33};

export class Preset {
    constructor(public data: {}) {
        if (!this.name) {
            this.name = `${this.type_str}_${this.charge_current}A`;
        }
    }

    json() {
        return JSON.stringify(this.data);
    }

    clone(): Preset {
        let jsonString = this.json();
        let newThing: Preset = new Preset(JSON.parse(jsonString));
        newThing.setWillSaveNewPreset();
        return newThing;
    }

    get getMaxAmpsPerChannel() {
        return iChargerService.getMaxAmpsPerChannel();
    }

    dischargeVoltageMinMax(): { min: number, max: number } {
        let anOption = {min: 0.1, max: 33};
        if (_dischargeVoltageMinMax[this.type]) {
            anOption = _dischargeVoltageMinMax[this.type];
        }
        // console.log("Using ", anOption, " as the volt/min/max");
        return anOption;
    }

    storageVoltageRange() {
        switch (this.type) {
            case ChemistryType.LiPo:
                return {min: 370, max: 390};
            case ChemistryType.LiFe:
                return {min: 310, max: 340};
        }
        return {min: 0.0, max: 0};
    }

    setWillSaveNewPreset() {
        this.data['index'] = -1;
    }

    get name(): string {
        return this.data['name'];
    }

    set name(value: string) {
        this.data['name'] = value;
    }

    get index(): number {
        return this.data['index'];
    }

    get type_str(): string {
        return this.data['type_str'];
    }

    get isLipo(): boolean {
        return this.type == ChemistryType.LiPo;
    }

    get type(): ChemistryType {
        return this.data['type'];
    }

    set type(value: ChemistryType) {
        this.data['type'] = value;
    }

    get cells(): number {
        switch (this.type) {
            case ChemistryType.LiPo:
                return this.data['li_cell'];
            case ChemistryType.NiMH:
                return this.data['ni_cell'];
            case ChemistryType.LiFe:
                return this.data['li_cell'];
        }
        return 0;
    }

    set cells(value: number) {
        value = +value;
        switch (this.type) {
            case ChemistryType.LiPo:
                this.data['li_cell'] = value;
                break;
            case ChemistryType.NiMH:
                this.data['ni_cell'] = value;
                break;
            case ChemistryType.LiFe:
                this.data['li_cell'] = value;
                break;
        }
    }

    get capacity(): number {
        // console.log(`getting capacity: ${this.data['capacity']}`);
        return this.data['capacity'];
    }

    set capacity(value: number) {
        this.data['capacity'] = +value;
    }

    get channel_mode(): number {
        return this.data['channel_mode'];
    }

    set channel_mode(value: number) {
        this.data['channel_mode'] = +value;
    }

    get save_to_sd(): boolean {
        return this.data['save_to_sd'];
    }

    set save_to_sd(value: boolean) {
        this.data['save_to_sd'] = value;
    }

    get run_counter(): number {
        return this.data['run_counter'];
    }

    set run_counter(value: number) {
        this.data['run_counter'] = +value;
    }

    get log_interval_sec(): number {
        return this.data['log_interval_sec'];
    }

    set log_interval_sec(value: number) {
        this.data['log_interval_sec'] = +value;
    }

    get balance_type(): LipoBalanceType {
        if (this.data['li_mode_c'] == 1) {
            return LipoBalanceType.DontBalance;
        }
        return Number(this.data['bal_speed']);
    }

    set balance_type(value: LipoBalanceType) {
        if (value == LipoBalanceType.DontBalance) {
            this.data['li_mode_c'] = 1;
            this.data['bal_speed'] = LipoBalanceType.User;
        } else {
            this.data['li_mode_c'] = 0;
            this.data['bal_speed'] = +value;
        }
    }

    get balance_end_type(): BalanceEndCondition {
        return this.data['li_balance_end_mode'];
    }

    set balance_end_type(value: BalanceEndCondition) {
        console.log(`Set balance end condition to ${value}`);
        this.data['li_balance_end_mode'] = Number(value);
    }

    get charge_cell_voltage(): number {
        switch (this.type) {
            case ChemistryType.LiPo:
                return this.data['lipo_charge_cell_voltage'];
            case ChemistryType.LiFe:
                return this.data['life_charge_cell_voltage'];
        }
        return 0;
    }

    set charge_cell_voltage(value: number) {
        value = +value;
        switch (this.type) {
            case ChemistryType.LiPo:
                this.data['lipo_charge_cell_voltage'] = value;
                break;
            case ChemistryType.LiFe:
                this.data['life_charge_cell_voltage'] = value;
                break;
        }
    }

    get charge_current(): number {
        return this.data['charge_current'];
    }

    set charge_current(value: number) {
        this.data['charge_current'] = +value;
    }

    // First saw this when doing NiMH
    get charge_mode(): number {
        if (this.type == ChemistryType.NiMH) {
            return this.data['ni_mode_c'];
        }
        return 0;
    }

    set charge_mode(value: number) {
        if (this.type == ChemistryType.NiMH) {
            this.data['ni_mode_c'] = +value;
        }
    }

    get discharge_current(): number {
        return +this.data['discharge_current'];
    }

    set discharge_current(value: number) {
        console.log('Set discharge to ', value);
        this.data['discharge_current'] = +value;
    }

    get discharge_voltage(): number {
        switch (this.type) {
            case ChemistryType.NiMH:
                return +this.data['ni_discharge_voltage'];

            case ChemistryType.LiFe:
                return +this.data['life_discharge_cell_voltage'];

            case ChemistryType.LiPo:
                return +this.data['lipo_discharge_cell_voltage'];
        }
        return 0;
    }

    set discharge_voltage(value: number) {
        value = +value;
        switch (this.type) {
            case ChemistryType.NiMH:
                this.data['ni_discharge_voltage'] = value;
                break;

            case ChemistryType.LiFe:
                this.data['life_discharge_cell_voltage'] = value;
                break;

            case ChemistryType.LiPo:
                this.data['lipo_discharge_cell_voltage'] = value;
        }
    }

    get charge_end_current(): number {
        return this.data['end_charge'];
    }

    set charge_end_current(value: number) {
        value = _.clamp(+value, 10, 50);
        this.data['end_charge'] = value;
    }

    get discharge_end_current(): number {
        return this.data['end_discharge'];
    }

    set discharge_end_current(value: number) {
        this.data['end_discharge'] = +value;
    }

    get showChargeVoltageWarning(): boolean {
        switch (this.type) {
            case ChemistryType.LiPo:
                return this.charge_cell_voltage > 4.2;
            case ChemistryType.LiFe:
                return this.charge_cell_voltage > 3.6;
        }
        return false;
    }

    get restore_voltage(): number {
        return this.data['restore_voltage'];
    }

    set restore_voltage(value: number) {
        this.data['restore_voltage'] = +value;
    }

    get restore_charge_time(): number {
        return this.data['restore_time'];
    }

    set restore_charge_time(value: number) {
        this.data['restore_time'] = +value;
    }

    get restore_charge_current(): number {
        return this.data['restore_current'];
    }

    set restore_charge_current(value: number) {
        this.data['restore_current'] = Number(value);
    }

    get keep_charging_after_done(): boolean {
        return this.data['keep_charge_enable'];
    }

    set keep_charging_after_done(value: boolean) {
        this.data['keep_charge_enable'] = value;
    }

    get show_in_presets_list(): boolean {
        return this.data['keep_charge_enable'];
    }

    set show_in_presets_list(value: boolean) {
        this.data['keep_charge_enable'] = value;
    }

    // charge safety
    get safety_charge_cutoff_temp(): number {
        return this.data['safety_temp_c'];
    }

    set safety_charge_cutoff_temp(value: number) {
        this.data['safety_temp_c'] = +value;
    }

    get safety_charge_capacity(): number {
        return this.data['safety_cap_c'];
    }

    set safety_charge_capacity(value: number) {
        this.data['safety_cap_c'] = Number(value);
    }

    get safety_charge_timer_enabled(): boolean {
        return this.data['safety_time_c'] > 0;
    }

    set safety_charge_timer_enabled(value: boolean) {
        this.data['safety_time_c'] = value ? 1 : 0;
    }

    get safety_charge_timer_time(): boolean {
        return this.data['safety_time_c'];
    }

    set safety_charge_timer_time(value: boolean) {
        this.data['safety_time_c'] = value;
    }

    // discharge safety
    get safety_discharge_cutoff_temp(): number {
        return this.data['safety_temp_d'];
    }

    set safety_discharge_cutoff_temp(value: number) {
        this.data['safety_temp_d'] = +value;
    }

    get safety_discharge_capacity(): number {
        return this.data['safety_cap_d'];
    }

    set safety_discharge_capacity(value: number) {
        this.data['safety_cap_d'] = +value;
    }

    get safety_discharge_timer_enabled(): boolean {
        return this.data['safety_time_d'] > 0;
    }

    set safety_discharge_timer_enabled(value: boolean) {
        this.data['safety_time_d'] = value ? 1 : 0;
    }

    get safety_discharge_timer_time(): boolean {
        return this.data['safety_time_d'];
    }

    set safety_discharge_timer_time(value: boolean) {
        this.data['safety_time_d'] = value;
    }

    // extra
    get discharge_extra_discharge_enabled(): boolean {
        return (this.data['li_mode_d'] & 0x01) == 0x01;
    }

    set discharge_extra_discharge_enabled(value: boolean) {
        if (value) {
            this.data['li_mode_d'] = this.data['li_mode_d'] || 0x01;
        } else {
            this.data['li_mode_d'] = this.data['li_mode_d'] && ~0x01;
        }
    }

    get discharge_balance_enabled(): boolean {
        return (this.data['li_mode_d'] & 0x02) == 0x02;
    }

    set discharge_balance_enabled(value: boolean) {
        if (value) {
            this.data['li_mode_d'] = this.data['li_mode_d'] || 0x02;
        } else {
            this.data['li_mode_d'] = this.data['li_mode_d'] && ~0x02;
        }
    }

    get regeneration_mode(): RegenerativeMode {
        return this.data['regen_discharge_mode'];
    }

    set regeneration_mode(value: RegenerativeMode) {
        this.data['regen_discharge_mode'] = Number(value);
    }

    get regeneration_method(): RegenerativeToChannelMethod {
        return this.data['reg_ch_mode'];
    }

    set regeneration_method(value: RegenerativeToChannelMethod) {
        this.data['reg_ch_mode'] = Number(value);
    }

    get regeneration_volt_limit(): number {
        return this.data['reg_ch_volt'];
    }

    set regeneration_volt_limit(value: number) {
        this.data['reg_ch_volt'] = Number(value);
    }

    get regeneration_current_limit(): number {
        return this.data['reg_ch_current'];
    }

    set regeneration_current_limit(value: number) {
        this.data['reg_ch_current'] = Number(value);
    }

    // storage
    get storage_cell_voltage(): number {
        switch (this.type) {
            case ChemistryType.LiPo:
                return this.data['lipo_storage_cell_voltage'];
            case ChemistryType.LiFe:
                return this.data['life_storage_cell_voltage'];
        }
        return 0;
    }

    set storage_cell_voltage(value: number) {
        value = Number(value);
        switch (this.type) {
            case ChemistryType.LiPo:
                this.data['lipo_storage_cell_voltage'] = value;
                break;
            case ChemistryType.LiFe:
                this.data['life_storage_cell_voltage'] = value;
                break;
        }
    }

    get storage_compensation_mv(): number {
        return this.data['store_compensation'];
    }

    set storage_compensation_mv(value: number) {
        this.data['store_compensation'] = Number(value);
    }

    get storage_accelerated(): boolean {
        return this.data['fast_store'];
    }

    set storage_accelerated(value: boolean) {
        this.data['fast_store'] = value;
    }

    // Cycle
    get cycle_mode(): Cycle {
        return this.data['cycle_mode'];
    }

    set cycle_mode(value: Cycle) {
        this.data['cycle_mode'] = Number(value);
    }

    get cycle_count(): number {
        return this.data['cycle_count'];
    }

    set cycle_count(value: number) {
        this.data['cycle_count'] = Number(value);
    }

    get cycle_delay(): number {
        return this.data['cycle_delay'];
    }

    set cycle_delay(value: number) {
        this.data['cycle_delay'] = Number(value);
    }

    // NiMH
    get ni_sensitivity(): number {
        return this.data['ni_peak'];
    }

    set ni_sensitivity(value: number) {
        this.data['ni_peak'] = +value;
    }

    get allow_zero_volt_charging(): boolean {
        return this.data['ni_zero_enable'];
    }

    set allow_zero_volt_charging(value: boolean) {
        this.data['ni_zero_enable'] = value;
    }

    get trickle_enabled(): boolean {
        return this.data['ni_trickle_enable'];
    }

    set trickle_enabled(value: boolean) {
        this.data['ni_trickle_enable'] = value;
    }

    get trickle_current(): number {
        return this.data['ni_trickle_current'];
    }

    set trickle_current(value: number) {
        this.data['ni_trickle_current'] = Number(value);
    }

    get trickle_timeout(): number {
        return this.data['ni_trickle_time'];
    }

    set trickle_timeout(value: number) {
        this.data['ni_trickle_time'] = Number(value);
    }

    public static chemistryPrefix(chemistry: ChemistryType) {
        switch (chemistry) {
            case ChemistryType.Anything:
                return 'All';
            case ChemistryType.LiPo:
                return 'LP';
            case ChemistryType.LiLo:
                return 'LL';
            case ChemistryType.LiFe:
                return 'LF';
            case ChemistryType.NiCd:
                return 'NC';
            case ChemistryType.NiMH:
                return 'NM';
            case ChemistryType.Pb:
                return 'Pb';
            case ChemistryType.NiZn:
                return 'NZ';
        }
        return 'ER';
    }

    smallButtonName(showChargeOption = true, useName: boolean = true) {
        let name = Preset.chemistryPrefix(this.type);
        if (useName) {
            if (this.name.length > 0) {
                return this.name;
            }
        }
        let rate = showChargeOption ? this.charge_current : this.discharge_current;
        return `${name} ${rate}A`;
    }

    updateFrom(other_preset) {
        this.data = other_preset.data;
    }

    get readonly(): boolean {
        return false;
        // return this.data['use_flag'] == 0; // fixed
    }
}
