import {Component} from "@angular/core";
import {PresetBasePage} from "../preset-charge/preset-charge";
import {NavController, NavParams} from "ionic-angular";
import {Configuration} from "../../services/configuration.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import {ChargerValidator} from "../../utils/validators";
import {RegenerativeMode, RegenerativeToChannelMethod, ChemistryType} from "../preset/preset-class";

@Component({
    selector: 'page-preset-discharge',
    templateUrl: 'preset-discharge.html'
})

export class PresetDischargePage extends PresetBasePage {
    formGroup: FormGroup = null;
    regenerationGroup: FormGroup = null;

    constructor(navCtrl: NavController,
                config: Configuration,
                private formBuilder: FormBuilder,
                navParams: NavParams) {
        super(navCtrl, config, navParams);
    }

    ionViewWillLeave() {
    }

    ngOnInit() {
        let dischargeVoltageMinMax = this.preset.dischargeVoltageMinMax();

        this.formGroup = this.formBuilder.group({
            dischargeCurrent: [this.preset.discharge_current,
                ChargerValidator.number({
                    min: 0.05,
                    max: this.config.getMaxAmpsPerChannel()
                })],
            dischargeVoltage: [this.preset.discharge_voltage,
                ChargerValidator.number(dischargeVoltageMinMax)],
            dischargeEndCurrent: [this.preset.discharge_end_current,
                ChargerValidator.number({
                    min: 1,
                    max: 100
                })]
        });

        this.regenerationGroup = this.formBuilder.group({
            regenVoltLimit: [this.preset.regeneration_volt_limit,
                ChargerValidator.number({
                    min: 0.01,
                    max: 33
                })],
            regenCurrentLimit: [this.preset.regeneration_current_limit,
                ChargerValidator.number({
                    min: 0.05,
                    max: this.config.getMaxAmpsPerChannel()
                })],
        });

        this.formGroup.valueChanges.subscribe(v => {
            if (this.formGroup.controls['dischargeVoltage'].errors) {
                console.log("Have errors", this.formGroup.controls['dischargeVoltage'].errors);
            }
        })
    }

    currentChoices() {
        let choices = [];
        for (let i = 50; i <= 200; i++) {
            choices.push(i / 100);
        }
        return choices;
    }

    showAdvanced() {
        return this.preset.type == ChemistryType.LiPo ||
            this.preset.type == ChemistryType.LiFe;
    }

    joinDisabled() {
        return this.preset.regeneration_mode == RegenerativeMode.Off ||
            this.preset.regeneration_mode != RegenerativeMode.ToChannel;
    }

    limitsDisabled() {
        // Don't show limits if a) not enabled of b) resistance/bulbs not set
        return this.joinDisabled() || this.preset.regeneration_method != RegenerativeToChannelMethod.ResistanceOrBulbs;
    }

    regenerationModeTypeOptions() {
        return [
            {'value': RegenerativeMode.Off, 'text': 'Off'},
            {'value': RegenerativeMode.ToInput, 'text': 'To input'},
            {'value': RegenerativeMode.ToChannel, 'text': 'To channel'},
        ];
    }

    regenerationMethodOptions() {
        return [
            {'value': RegenerativeToChannelMethod.ResistanceOrBulbs, 'text': 'Resistance / Bulbs'},
            {'value': RegenerativeToChannelMethod.ChargingBattery, 'text': 'Charging battery'},
        ];
    }

}
