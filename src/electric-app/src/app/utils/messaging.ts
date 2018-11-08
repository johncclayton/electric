import {ToastController} from '@ionic/angular';
import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ToastHelper {
    constructor(private toast: ToastController) {
    }

    async showErrorMessage(message: string, showClose = false) {
        return this._showMessage(message, true, showClose);
    }

    async showMessage(message: string, showClose = false) {
        return this._showMessage(message, false, showClose);
    }

    private async _showMessage(message: string, isError: boolean = false, showClose = false) {
        let opts = {
            message: message,
            cssClass: `messaging ${isError ? 'error' : 'success'}`,
            showCloseButton: showClose,
            position: 'bottom'
        };

        if (!showClose) {
            opts['duration'] = 2000;
        }

        // @ts-ignore
        let toast = await this.toast.create(opts);
        toast.present();
    }
}
