import {Component, Input} from "@angular/core";
import {ChannelVoltsComponent} from "../channel-volts/channel-volts";
import {Channel} from "../../models/channel";

@Component({
    selector: 'channel-chart',
    templateUrl: 'channel-chart.html'
})
export class ChannelChartComponent extends ChannelVoltsComponent {
    @Input() channel: Channel;
    @Input() height: number;

    cellVoltageLabels = [];
    voltageData = [
        {data: [0]},
    ];

    cellVoltageOptions: any = {
        responsive: true,
        showLines: true,
        animation: {
            duration: 0
        },
        elements: {
            point: {
                radius: 0,
            }
        },
        legend: {
            display: false,
        },
        scales: {
            xAxes: [{
                gridLines: {
                    display: false,
                }
            }],
            yAxes: [{
                gridLines: {
                    display: false,
                }
            }]
        }
    };

    constructor() {
        super();
    }

    maxNumberOfDataPoints() {
        return 30;
    }

    ngOnChanges(changes) {
        // Extract the last 30 series data
        let cellHistory = this.channel.history();
        if (cellHistory) {
            // Convert the history data to a limited subset of chart.js data
            this.voltageData = cellHistory.map((arrayOfCells, index) => {
                let slice = arrayOfCells.slice(-this.maxNumberOfDataPoints());
                return {
                    data: slice.map(cell => cell.v),
                    fill: false,
                    borderwidth: 1
                }
            });
        }
        this.setCellVoltageLabels();
        super.ngOnChanges(changes);
    }


    setCellVoltageLabels() {
        let labels = [];
        for (let i = 0; i < this.maxNumberOfDataPoints(); i++) {
            labels[i] = '';
        }
        this.cellVoltageLabels = labels;
    }

    returnToVoltageComponent() {
    }

}
