import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private count = 0;
  private loading$ = new BehaviorSubject<boolean>(false);

  readonly isLoading$ = this.loading$.asObservable();

  show() {
    this.count++;

    if (this.count === 1) {
      Promise.resolve().then(() => {
        this.loading$.next(true);
      });
    }
  }

  hide() {
    this.count--;

    if (this.count <= 0) {
      this.count = 0;

      Promise.resolve().then(() => {
        this.loading$.next(false);
      });
    }
  }

  reset() {
    this.count = 0;

    Promise.resolve().then(() => {
      this.loading$.next(false);
    });
  }
}