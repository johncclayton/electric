import {Injectable} from '@angular/core';
import {IAppState} from '../configure';
import {NgRedux} from '@angular-redux/store';
import {CustomNGXLoggerService, NGXLogger, NgxLoggerLevel} from 'ngx-logger';

@Injectable({
    providedIn: 'root'
})
export class UIActions {
    static SET_EXCEPTION_MESSAGE: string = 'SET_EXCEPTION_MESSAGE';
    static SET_CONFIG_NETWORK: string = 'SET_CONFIG_NETWORK';
    static SET_EXCEPTION_FROM_ERROR: string = 'SET_EXCEPTION_FROM_ERROR';
    static CLEAR_EXCEPTION_MESSAGE: string = 'CLEAR_EXCEPTION_MESSAGE';
    static SET_SAVING: string = 'SET_SAVING';
    static SET_NOTSAVING: string = 'SET_NOTSAVING';

    static SERVER_DISCONNECTED: string = 'SERVER_DISCONNECTED';
    static SERVER_RECONNECTED: string = 'SERVER_RECONNECTED';
    private logger: NGXLogger;

    constructor(private ngRedux: NgRedux<IAppState>, private loggerSvc: CustomNGXLoggerService) {
        this.logger = this.loggerSvc.create({level: NgxLoggerLevel.INFO});
    }

    setIsSaving() {
        this.ngRedux.dispatch({
            type: UIActions.SET_SAVING
        });
    }

    setIsNotSaving() {
        this.ngRedux.dispatch({
            type: UIActions.SET_NOTSAVING
        });
    }

    clearError() {
        this.ngRedux.dispatch({
            type: UIActions.CLEAR_EXCEPTION_MESSAGE,
        });
    }

    setErrorFromErrorObject(userMessage: string, error: Error) {
        if (!error) {
            this.logger.info('setErrorFromErrorObject called with nothing');
            return;
        }
        this.ngRedux.dispatch({
            type: UIActions.SET_EXCEPTION_FROM_ERROR,
            payload: {
                userMessage: userMessage,
                error: error
            },
        });
    }

    setErrorMessageFromString(message: string) {
        this.ngRedux.dispatch({
            type: UIActions.SET_EXCEPTION_MESSAGE,
            payload: message,
        });
    }

    setDisconnected() {
        this.ngRedux.dispatch({
            type: UIActions.SERVER_DISCONNECTED
        });
    }

    serverReconnected() {
        this.ngRedux.dispatch({
            type: UIActions.SERVER_RECONNECTED
        });
    }

    setConfiguringNetwork(new_value: boolean) {
        this.ngRedux.dispatch({
            type: UIActions.SET_CONFIG_NETWORK,
            payload: new_value
        });
    }
}
