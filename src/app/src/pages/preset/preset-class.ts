export enum ChemistryType {
    LiPo = 0,
    LiLo,
    LiFe,
    NiCd,
    NiMH,
    NiZn,
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

export class Preset {
    data: {} = {};

    constructor(public presetDict: {}) {
        this.data = presetDict;
    }

    get name(): string {
        return this.data['name'];
    }

    set name(value: string) {
        this.data['name'] = value;
    }

    get type_str(): string {
        return this.data['type_str'];
    }

    get type(): ChemistryType {
        return this.data['type'];
    }

    set type(value: ChemistryType) {
        this.data['type'] = value;
    }

    get cells(): number {
        return this.data['li_cell'];
    }

    set cells(value: number) {
        this.data['li_cell'] = value;
    }

    get capacity(): number {
        return this.data['capacity'];
    }

    set capacity(value: number) {
        this.data['capacity'] = value;
    }

    get channel_mode(): number {
        return this.data['channel_mode'];
    }

    set channel_mode(value: number) {
        this.data['channel_mode'] = value;
    }

    get save_to_sd(): number {
        return this.data['save_to_sd'];
    }

    set save_to_sd(value: number) {
        this.data['save_to_sd'] = value;
    }

    get run_counter(): number {
        return this.data['run_counter'];
    }

    set run_counter(value: number) {
        this.data['run_counter'] = value;
    }

    get log_interval_sec(): number {
        return this.data['log_interval_sec'];
    }

    set log_interval_sec(value: number) {
        this.data['log_interval_sec'] = value;
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
            this.data['bal_speed'] = value;
        }
    }

    get balance_end_type(): BalanceEndCondition {
        return this.data['li_balance_end_mode'];
    }

    set balance_end_type(value: BalanceEndCondition) {
        this.data['li_balance_end_mode'] = value;
    }

    get charge_cell_voltage(): number {
        return this.data['lipo_charge_cell_voltage'];
    }

    set charge_cell_voltage(value: number) {
        this.data['lipo_charge_cell_voltage'] = value;
    }

    get charge_current(): number {
        return this.data['charge_current'];
    }

    set charge_current(value: number) {
        this.data['charge_current'] = value;
    }

    get discharge_current(): number {
        return this.data['discharge_current'];
    }

    set discharge_current(value: number) {
        this.data['discharge_current'] = value;
    }

    get discharge_voltage(): number {
        return this.data['lipo_discharge_cell_voltage'];
    }

    set discharge_voltage(value: number) {
        this.data['lipo_discharge_cell_voltage'] = value;
    }

    get discharge_end_current(): number {
        return this.data['end_discharge'];
    }

    set discharge_end_current(value: number) {
        this.data['end_discharge'] = value;
    }

    get showChargeVoltageWarning(): boolean {
        return this.charge_cell_voltage > 4.2;
    }

    get restore_voltage(): number {
        return this.data['restore_voltage'];
    }

    set restore_voltage(value: number) {
        this.data['restore_voltage'] = value;
    }

    get restore_charge_time(): number {
        return this.data['restore_time'];
    }

    set restore_charge_time(value: number) {
        this.data['restore_time'] = value;
    }

    get restore_charge_current(): number {
        return this.data['restore_current'];
    }

    set restore_charge_current(value: number) {
        this.data['restore_current'] = value;
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
        this.data['safety_temp_c'] = value;
    }

    get safety_charge_capacity(): number {
        return this.data['safety_cap_c'];
    }

    set safety_charge_capacity(value: number) {
        this.data['safety_cap_c'] = value;
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
        this.data['safety_temp_d'] = value;
    }

    get safety_discharge_capacity(): number {
        return this.data['safety_cap_d'];
    }

    set safety_discharge_capacity(value: number) {
        this.data['safety_cap_d'] = value;
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
        if(value) {
            this.data['li_mode_d'] = this.data['li_mode_d'] || 0x01;
        } else{
            this.data['li_mode_d'] = this.data['li_mode_d'] && ~0x01;
        }
    }

    get discharge_balance_enabled(): boolean {
        return (this.data['li_mode_d'] & 0x02) == 0x02;
    }

    set discharge_balance_enabled(value: boolean) {
        if(value) {
            this.data['li_mode_d'] = this.data['li_mode_d'] || 0x02;
        } else {
            this.data['li_mode_d'] = this.data['li_mode_d'] && ~0x02;
        }
    }

    get regeneration_mode(): RegenerativeMode {
        return this.data['regen_discharge_mode'];
    }

    set regeneration_mode(value: RegenerativeMode) {
        this.data['regen_discharge_mode'] = value;
    }

    get regeneration_method(): RegenerativeToChannelMethod {
        return this.data['reg_ch_mode'];
    }

    set regeneration_method(value: RegenerativeToChannelMethod) {
        this.data['reg_ch_mode'] = value;
    }

    get regeneration_volt_limit(): number {
        return this.data['reg_ch_volt'];
    }

    set regeneration_volt_limit(value: number) {
        this.data['reg_ch_volt'] = value;
    }

    get regeneration_current_limit(): number {
        return this.data['reg_ch_current'];
    }

    set regeneration_current_limit(value: number) {
        this.data['reg_ch_current'] = value;
    }
}
