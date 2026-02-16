import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.page.html',
  styleUrls: ['./privacy.page.scss'],
})
export class PrivacyPage implements OnInit {

  constructor(private modalCtrl: ModalController) { }
  
  ngOnInit(): void {
  }

  close() {
    this.modalCtrl.dismiss();
  }
}