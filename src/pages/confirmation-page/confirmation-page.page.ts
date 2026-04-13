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

  constructor(private router: Router) {
    this.getQueryParams();
  }

  getQueryParams() {
    const nav = this.router.getCurrentNavigation();
    const userId = nav?.extras.queryParams?.['userId'];
    const editingExistingAppointment = nav?.extras.queryParams?.['editingExistingAppointment'];

    this.userId = userId || 0;
    this.editingExistingAppointment = editingExistingAppointment || false;
  }

  goToQueue() {
    this.router.navigate(['/queue'], {
      queryParams: {
        userId: this.userId,
        editingExistingAppointment: this.editingExistingAppointment,
        state: { from: 'confirmation' }
      }
    });
  }

  goToSchedule() {
    // Navega para a agenda ou página inicial
    this.router.navigate(['/schedule']);

    // Ou limpa o histórico e vai para a agenda
    // this.router.navigate(['/schedule'], { replaceUrl: true });
  }
}