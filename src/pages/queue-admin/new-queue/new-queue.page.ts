import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { QueueCreateRequest } from 'src/models/requests/queue-create-request';
import { StoreModel } from 'src/models/store-model';
import { UserModel } from 'src/models/user-model';
import { QueueService } from 'src/services/queue.service';
import { SessionService } from 'src/services/session.service';



@Component({
  selector: 'app-new-queue',
  templateUrl: './new-queue.page.html',
  styleUrls: ['./new-queue.page.scss']
})

export class NewQueuePage implements OnInit {

  isEditing = false;
  queueToEdit: any = null;
  form: any;
  user: UserModel | null = null;
  store: StoreModel | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastCtrl: ToastController,
    private queueService: QueueService,
    private sesseionService: SessionService
  ) {
    const nav = this.router.getCurrentNavigation();
    this.queueToEdit = nav?.extras?.state?.['queue'] || null;
    this.isEditing = !!this.queueToEdit;
    this.initializeForm();

    this.user = sesseionService.getUser();
    this.store = sesseionService.getStore();
  }

  ngOnInit() {
    if (this.isEditing) {
      this.patchFormWithQueueData();
    }
  }

  private initializeForm() {
    const today = new Date().toISOString();
    const defaultOpeningTime = new Date();
    defaultOpeningTime.setHours(8, 0, 0);

    const defaultClosingTime = new Date();
    defaultClosingTime.setHours(18, 0, 0);

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      date: [today.split('T')[0], Validators.required],
      openingTime: [defaultOpeningTime.toISOString(), Validators.required],
      closingTime: [defaultClosingTime.toISOString(), [
        Validators.required,
        this.validateClosingTime.bind(this)
      ]],
      type: ['normal', Validators.required],
      isRecurring: [false],
      recurringDays: [[]],
      recurringEndDate: ['']
    });
  }

  patchFormWithQueueData() {
    if (this.queueToEdit) {
      this.form?.patchValue({
        name: this.queueToEdit.name,
        date: this.queueToEdit.date,
        openingTime: this.queueToEdit.openingTime || new Date().toISOString(),
        closingTime: this.queueToEdit.closingTime || new Date().toISOString(),
        type: this.queueToEdit.type || 'normal',
        isRecurring: this.queueToEdit.isRecurring || false,
        recurringDays: this.queueToEdit.recurringDays || [],
        recurringEndDate: this.queueToEdit.recurringEndDate || ''
      });
    }
  }

  validateClosingTime(control: any) {
    if (!this.form) return null;

    const openingTime = this.form.get('openingTime')?.value;
    const closingTime = control.value;

    if (!openingTime || !closingTime) return null;

    const opening = new Date(openingTime).getTime();
    const closing = new Date(closingTime).getTime();

    return closing > opening ? null : { invalidClosingTime: true };
  }

  async save() {
    if (this.form?.invalid) {
      await this.showToast('Preencha todos os campos corretamente.', 'danger');
      return;
    }

    const formValue = this.form.value;

    const queueRequest: QueueCreateRequest = {
      storeId: this.store?.id!,
      employeeId: this.user?.id!,
      description: formValue.name.trim(),
      date: formValue.date,
      openingTime: formValue.openingTime,
      closingTime: formValue.closingTime,
      type: formValue.type,
      isRecurring: formValue.isRecurring,
      ...(formValue.type === 'priority' && { eligibleGroups: formValue.eligibleGroups || [] }),
      ...(formValue.type === 'express' && { maxServiceTime: formValue.maxServiceTime }),
      ...(formValue.isRecurring && {
        recurringDays: formValue.recurringDays || [],
        recurringEndDate: formValue.recurringEndDate || null
      })
    };

    try {
      this.queueService.createQueue(queueRequest).subscribe({
        next: async () => {
          await this.showToast('Fila criada com sucesso!', 'success');
          this.router.navigate(['/queue-admin']);
        },
        error: async (error) => {
          console.error(error);
          await this.showToast('Erro ao salvar fila. Tente novamente.', 'danger');
        }
      });

    } catch (error) {
      console.error(error);
      await this.showToast('Erro ao salvar fila. Tente novamente.', 'danger');
    }
  }
  
  cancel() {
    this.router.navigate(['/queue-admin']);
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
