import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation-page.page.html',
  styleUrls: ['./confirmation-page.page.scss'],
})
export class ConfirmationPage {

  userId: number = 0;
  editingExistingAppointment = false;
  isOwner = false;

  constructor(private router: Router) {
    this.getQueryParams();
  }

  getQueryParams() {
    const nav = this.router.getCurrentNavigation();
    const userId = nav?.extras.queryParams?.['userId'];
    const editingExistingAppointment = nav?.extras.queryParams?.['editingExistingAppointment'];
    this.isOwner = nav?.extras.queryParams?.['isOwner'];

    this.userId = userId || 0;
    this.editingExistingAppointment = editingExistingAppointment || false;
  }

  goToMainPage() {
    if (this.isOwner) {
      this.router.navigate(['/owner-schedule']);
      return;
    }

    this.router.navigate(['/queue'], {
      queryParams: {
        userId: this.userId,
        editingExistingAppointment: this.editingExistingAppointment,
        state: { from: 'confirmation' }
      }
    });
  } 
}