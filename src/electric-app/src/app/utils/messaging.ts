import {ToastController} from '@ionic/angular';
import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ToastHelper {
    constructor(private toast: ToastController) {
    }

    async showMessage(message: string, isError: boolean = false) {
        let toast = await this.toast.create({
            message: message,
            cssClass: `messaging ${isError ? 'error' : 'success'}`,
            duration: 2000,
            // showCloseButton: true,
            position: 'bottom'
        });
        toast.present();
    }
}
