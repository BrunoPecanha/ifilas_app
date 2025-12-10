import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnectionQueue: signalR.HubConnection | null = null;
  private hubConnectionNotification: signalR.HubConnection | null = null;
  private hubConnectionSchedule: signalR.HubConnection | null = null;

  private joinedGroupsQueue = new Set<string>();
  private joinedGroupsNotification = new Set<string>();
  private joinedGroupsSchedule = new Set<string>();

  private connectionPromiseQueue: Promise<void> | null = null;
  private connectionPromiseNotification: Promise<void> | null = null;
  private connectionPromiseSchedule: Promise<void> | null = null;

  constructor() { }

  public async startQueueConnection(): Promise<void> {
    if (this.connectionPromiseQueue) {
      return this.connectionPromiseQueue;
    }
    this.hubConnectionQueue = new signalR.HubConnectionBuilder()
      .withUrl(environment.queueHub, {
        transport: signalR.HttpTransportType.WebSockets,
        accessTokenFactory: () => sessionStorage.getItem('token') || ''
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          if (retryContext.elapsedMilliseconds < 30000) {
            return Math.random() * 2000 + 2000;
          }
          return Math.random() * 10000 + 10000;
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupQueueConnectionEvents();

    this.connectionPromiseQueue = this.hubConnectionQueue.start()
      .then(() => {
        this.rejoinQueueGroups();
      })
      .catch(err => {
        this.connectionPromiseQueue = null;
        throw err;
      });

    return this.connectionPromiseQueue;
  }

  private setupQueueConnectionEvents(): void {
    if (!this.hubConnectionQueue) return;

    this.hubConnectionQueue.onreconnecting(error => { });

    this.hubConnectionQueue.onreconnected(() => {
      this.rejoinQueueGroups();
    });

    this.hubConnectionQueue.onclose(error => {
      this.connectionPromiseQueue = null;
    });
  }

  public async joinQueueGroup(groupName: string): Promise<void> {
    if (!this.isQueueConnected()) {
      await this.startQueueConnection();
    }

    if (this.joinedGroupsQueue.has(groupName)) {
      return;
    }

    try {
      await this.hubConnectionQueue?.invoke('JoinGroup', groupName);
      this.joinedGroupsQueue.add(groupName);
    } catch (err) {
      throw err;
    }
  }

  private async rejoinQueueGroups(): Promise<void> {
    if (this.joinedGroupsQueue.size === 0) return;
    await Promise.all(
      Array.from(this.joinedGroupsQueue).map(group => this.hubConnectionQueue?.invoke('JoinGroup', group))
    );
  }

  public onUpdateQueue(callback: (data: any) => void): void {
    this.hubConnectionQueue?.off('UpdateQueue');
    this.hubConnectionQueue?.on('UpdateQueue', callback);
  }

  public offUpdateQueue(): void {
    this.hubConnectionQueue?.off('UpdateQueue');
  }

  public async notifyQueueGroup(groupName: string, data: any): Promise<void> {
    if (!this.isQueueConnected()) {
      await this.startQueueConnection();
    }
    await this.hubConnectionQueue?.invoke('NotifyGroup', groupName, data);
  }

  public isQueueConnected(): boolean {
    return this.hubConnectionQueue?.state === signalR.HubConnectionState.Connected;
  }

  public async leaveQueueGroup(groupName: string): Promise<void> {
    if (!this.isQueueConnected()) return;
    if (!this.joinedGroupsQueue.has(groupName)) return;

    try {
      await this.hubConnectionQueue?.invoke('LeaveGroup', groupName);
      this.joinedGroupsQueue.delete(groupName);
    } catch (err) {
      throw err;
    }
  }

  public async leaveAllQueueGroups(): Promise<void> {
    if (!this.isQueueConnected() || this.joinedGroupsQueue.size === 0) return;
    await Promise.all(Array.from(this.joinedGroupsQueue).map(group => this.leaveQueueGroup(group)));
  }

  public getQueueConnectionId(): string | null {
    return this.hubConnectionQueue?.connectionId || null;
  }

  public async startNotificationConnection(): Promise<void> {
    if (this.connectionPromiseNotification) {
      return this.connectionPromiseNotification;
    }

    this.hubConnectionNotification = new signalR.HubConnectionBuilder()
      .withUrl(environment.notificationHub, {
        transport: signalR.HttpTransportType.WebSockets,
        accessTokenFactory: () => sessionStorage.getItem('token') || ''
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          if (retryContext.elapsedMilliseconds < 30000) {
            return Math.random() * 2000 + 2000;
          }
          return Math.random() * 10000 + 10000;
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupNotificationConnectionEvents();

    this.connectionPromiseNotification = this.hubConnectionNotification.start()
      .then(() => {
        this.rejoinNotificationGroups();
      })
      .catch(err => {
        this.connectionPromiseNotification = null;
        throw err;
      });

    return this.connectionPromiseNotification;
  }

  private setupNotificationConnectionEvents(): void {
    if (!this.hubConnectionNotification) return;

    this.hubConnectionNotification.onreconnecting(() => { });

    this.hubConnectionNotification.onreconnected(() => {
      this.rejoinNotificationGroups();
    });

    this.hubConnectionNotification.onclose(() => {
      this.connectionPromiseNotification = null;
    });
  }

  public async joinNotificationGroup(groupName: string): Promise<void> {
    if (!this.isNotificationConnected()) {
      await this.startNotificationConnection();
    }

    if (this.joinedGroupsNotification.has(groupName)) {
      return;
    }

    try {
      await this.hubConnectionNotification?.invoke('JoinGroup', groupName);
      this.joinedGroupsNotification.add(groupName);
    } catch (err) {
      throw err;
    }
  }

  private async rejoinNotificationGroups(): Promise<void> {
    if (this.joinedGroupsNotification.size === 0) return;

    await Promise.all(
      Array.from(this.joinedGroupsNotification).map(group => this.hubConnectionNotification?.invoke('JoinGroup', group))
    );
  }

  public onReceiveNotification(callback: (notification: any) => void): void {
    this.hubConnectionNotification?.off('ReceiveNotification');
    this.hubConnectionNotification?.on('ReceiveNotification', (notification) => {
      callback(notification);
    });
  }

  public async notifyNotificationGroup(groupName: string, data: any): Promise<void> {
    if (!this.isNotificationConnected()) {
      await this.startNotificationConnection();
    }
    await this.hubConnectionNotification?.invoke('NotifyGroup', groupName, data);
  }

  public isNotificationConnected(): boolean {
    return this.hubConnectionNotification?.state === signalR.HubConnectionState.Connected;
  }

  public async leaveNotificationGroup(groupName: string): Promise<void> {
    if (!this.isNotificationConnected()) return;
    if (!this.joinedGroupsNotification.has(groupName)) return;

    try {
      await this.hubConnectionNotification?.invoke('LeaveGroup', groupName);
      this.joinedGroupsNotification.delete(groupName);
    } catch (err) {
      throw err;
    }
  }

  public async leaveAllNotificationGroups(): Promise<void> {
    if (!this.isNotificationConnected() || this.joinedGroupsNotification.size === 0) return;
    await Promise.all(Array.from(this.joinedGroupsNotification).map(group => this.leaveNotificationGroup(group)));
  }

  public getNotificationConnectionId(): string | null {
    return this.hubConnectionNotification?.connectionId || null;
  }

  public async startScheduleConnection(): Promise<void> {
    if (this.connectionPromiseSchedule) {
      return this.connectionPromiseSchedule;
    }
    this.hubConnectionSchedule = new signalR.HubConnectionBuilder()
      .withUrl(environment.scheduleHub, {
        transport: signalR.HttpTransportType.WebSockets,
        accessTokenFactory: () => sessionStorage.getItem('token') || ''
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          if (retryContext.elapsedMilliseconds < 30000) {
            return Math.random() * 2000 + 2000;
          }
          return Math.random() * 10000 + 10000;
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupScheduleConnectionEvents();

    this.connectionPromiseSchedule = this.hubConnectionSchedule.start()
      .then(() => {
        this.rejoinScheduleGroups();
      })
      .catch(err => {
        this.connectionPromiseSchedule = null;
        throw err;
      });

    return this.connectionPromiseSchedule;
  }

  private setupScheduleConnectionEvents(): void {
    if (!this.hubConnectionSchedule) return;

    this.hubConnectionSchedule.onreconnecting(() => { });

    this.hubConnectionSchedule.onreconnected(() => {
      this.rejoinScheduleGroups();
    });

    this.hubConnectionSchedule.onclose(() => {
      this.connectionPromiseSchedule = null;
    });
  }

  public async joinScheduleGroup(groupName: string): Promise<void> {
    if (!this.isScheduleConnected()) {
      await this.startScheduleConnection();
    }

    if (this.joinedGroupsSchedule.has(groupName)) {
      return;
    }

    try {
      await this.hubConnectionSchedule?.invoke('JoinGroup', groupName);
      this.joinedGroupsSchedule.add(groupName);
    } catch (err) {
      throw err;
    }
  }

  private async rejoinScheduleGroups(): Promise<void> {
    if (this.joinedGroupsSchedule.size === 0) return;

    await Promise.all(
      Array.from(this.joinedGroupsSchedule).map(group => this.hubConnectionSchedule?.invoke('JoinGroup', group))
    );
  }

  public onUpdateSchedule(callback: (data: any) => void): void {
    this.hubConnectionSchedule?.off('UpdateSchedule');
    this.hubConnectionSchedule?.on('UpdateSchedule', callback);
  }

  public offUpdateSchedule(): void {
    this.hubConnectionSchedule?.off('UpdateSchedule');
  }

  public async notifyScheduleGroup(groupName: string, data: any): Promise<void> {
    if (!this.isScheduleConnected()) {
      await this.startScheduleConnection();
    }
    await this.hubConnectionSchedule?.invoke('NotifyGroup', groupName, data);
  }

  public isScheduleConnected(): boolean {
    return this.hubConnectionSchedule?.state === signalR.HubConnectionState.Connected;
  }

  public async leaveScheduleGroup(groupName: string): Promise<void> {
    if (!this.isScheduleConnected()) return;
    if (!this.joinedGroupsSchedule.has(groupName)) return;

    try {
      await this.hubConnectionSchedule?.invoke('LeaveGroup', groupName);
      this.joinedGroupsSchedule.delete(groupName);
    } catch (err) {
      throw err;
    }
  }

  public async leaveAllScheduleGroups(): Promise<void> {
    if (!this.isScheduleConnected() || this.joinedGroupsSchedule.size === 0) return;
    await Promise.all(Array.from(this.joinedGroupsSchedule).map(group => this.leaveScheduleGroup(group)));
  }

  public getScheduleConnectionId(): string | null {
    return this.hubConnectionSchedule?.connectionId || null;
  }

  public async stopAllConnections(): Promise<void> {
    try {
      await Promise.all([
        this.leaveAllQueueGroups(),
        this.leaveAllNotificationGroups(),
        this.leaveAllScheduleGroups(),
        this.hubConnectionQueue?.stop(),
        this.hubConnectionNotification?.stop(),
        this.hubConnectionSchedule?.stop()
      ]);
    } catch (err) {
      throw err;
    } finally {
      this.hubConnectionQueue = null;
      this.hubConnectionNotification = null;
      this.hubConnectionSchedule = null;
      this.connectionPromiseQueue = null;
      this.connectionPromiseNotification = null;
      this.connectionPromiseSchedule = null;
      this.joinedGroupsQueue.clear();
      this.joinedGroupsNotification.clear();
      this.joinedGroupsSchedule.clear();
    }
  }

  public isAnyConnected(): boolean {
    return this.isQueueConnected() || this.isNotificationConnected() || this.isScheduleConnected();
  }
}