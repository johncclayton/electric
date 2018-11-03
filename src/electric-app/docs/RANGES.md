ion-range controls in I4 are weird.

      <ion-list class="charger-slider">
          <ion-list-header>Rara</ion-list-header>
          <ion-item lines="none">
              <ion-label text-center>Something -
                  <ion-badge>{{some_number}}A</ion-badge>
              </ion-label>
          </ion-item>
          <ion-item>
              <ion-range [(ngModel)]="some_number" min="1" max="25">
                  <ion-label slot="start">1%</ion-label>
                  <ion-label slot="end">100%</ion-label>
              </ion-range>
          </ion-item>

          <ion-item lines="none" class="charger-slider">
              <ion-label text-center>Discharge Current -
                  <ion-badge>{{some_number}}A</ion-badge>
              </ion-label>
          </ion-item>
          <better-range [(value)]="some_number"
                        min="0.05"
                        [max]="25"
                        multiplier="100"
                        left_label="0.05A"
                        right_label="25A"
          ></better-range>
      </ion-list>


I have had to make custom CSS to get them to render nicely.

Rules:

- Every item must be wrapped in its own ion-item.
- You cannot have multiple rows/lines/items inside an ion-item
- You need lines='none' for those items that you want to NOT Look like lines. Sigh.
- Add class="charger-slider" to every ion-list that you want to render sanely.
