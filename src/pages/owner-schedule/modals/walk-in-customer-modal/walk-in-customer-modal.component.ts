import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-walk-in-customer-modal',
  templateUrl: "./walk-in-customer-modal.component.html",
  styleUrls: ["./walk-in-customer-modal.component.scss"]
})
export class WalkInCustomerModalComponent {
  customerForm: any;

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder
  ) {
    this.customerForm = this.formBuilder.group({
      name: ['', Validators.required],
      phone: [''],
      email: ['']
    });
  }

  saveCustomer() {
    if (this.customerForm.valid) {
      this.modalController.dismiss({
        customerData: this.customerForm.value
      });
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }
}