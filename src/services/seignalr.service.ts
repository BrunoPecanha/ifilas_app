import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnectionQueue: signalR.HubConnection | null = null;
  private hubConnectionNotification: signalR.HubConnection | null = null;

  private joinedGroupsQueue = new Set<string>();
  private joinedGroupsNotification = new Set<string>();

  private connectionPromiseQueue: Promise<void> | null = null;
  private connectionPromiseNotification: Promise<void> | null = null;

  constructor() { }

  public async startQueueConnection(): Promise<void> {
    if (this.connectionPromiseQueue) {
      return this.connectionPromiseQueue;
    }

    console.log('Token usado para SignalR:', sessionStorage.getItem('token'));

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
        console.log('SignalR (Queue) conectado via WebSockets');
        this.rejoinQueueGroups();
      })
      .catch(err => {
        console.error('Erro ao conectar SignalR QUEUE:', err);
        this.connectionPromiseQueue = null;
        throw err;
      });

    return this.connectionPromiseQueue;
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
        console.log('✅ SignalR (Notification) conectado via WebSockets');
        this.rejoinNotificationGroups();
      })
      .catch(err => {
        console.error('❌ Erro ao conectar SignalR NOTIFICATION:', err);
        this.connectionPromiseNotification = null;
        throw err;
      });

    return this.connectionPromiseNotification;
  }

  private setupQueueConnectionEvents(): void {
    if (!this.hubConnectionQueue)
      return;

    this.hubConnectionQueue.onreconnecting(error => {
      console.warn(`SignalR QUEUE reconectando... (${error?.message || 'Sem erro'})`);
    });

    this.hubConnectionQueue.onreconnected(connectionId => {
      this.rejoinQueueGroups();
    });

    this.hubConnectionQueue.onclose(error => {
      console.error(`Conexão SignalR QUEUE fechada. ${error ? 'Erro: ' + error.message : 'Conexão encerrada'}`);
      this.connectionPromiseQueue = null;
    });
  }

  private setupNotificationConnectionEvents(): void {
    if (!this.hubConnectionNotification) return;

    this.hubConnectionNotification.onreconnecting(error => {
      console.warn(`SignalR NOTIFICATION reconectando... (${error?.message || 'Sem erro'})`);
    });

    this.hubConnectionNotification.onreconnected(connectionId => {
      this.rejoinNotificationGroups();
    });

    this.hubConnectionNotification.onclose(error => {
      console.error(`Conexão SignalR 'notification' fechada. ${error ? 'Erro: ' + error.message : 'Conexão encerrada'}`);
      this.connectionPromiseNotification = null;
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
      console.error(`Erro ao entrar no grupo QUEUE ${groupName}:`, err);
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
      console.error(`Erro ao entrar no grupo NOTIFICATION ${groupName}:`, err);
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
      console.log('🎯 Notificação recebida via SignalR:', notification);
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

  public async stopAllConnections(): Promise<void> {
    try {
      await Promise.all([
        this.leaveAllQueueGroups(),
        this.leaveAllNotificationGroups(),
        this.hubConnectionQueue?.stop(),
        this.hubConnectionNotification?.stop()
      ]);
    } catch (err) {
      throw err;
    } finally {
      this.hubConnectionQueue = null;
      this.hubConnectionNotification = null;
      this.connectionPromiseQueue = null;
      this.connectionPromiseNotification = null;
      this.joinedGroupsQueue.clear();
      this.joinedGroupsNotification.clear();
    }
  }

  public async leaveAllQueueGroups(): Promise<void> {
    if (!this.isQueueConnected() || this.joinedGroupsQueue.size === 0) return;

    await Promise.all(
      Array.from(this.joinedGroupsQueue).map(group => this.leaveQueueGroup(group))
    );
  }

  public async leaveQueueGroup(groupName: string): Promise<void> {
    if (!this.isQueueConnected()) {
      return;
    }

    if (!this.joinedGroupsQueue.has(groupName)) {
      return;
    }

    try {
      await this.hubConnectionQueue?.invoke('LeaveGroup', groupName);
      this.joinedGroupsQueue.delete(groupName);
    } catch (err) {
      console.error(`Erro ao sair do grupo fila ${groupName}:`, err);
      throw err;
    }
  }

  public async leaveAllNotificationGroups(): Promise<void> {
    if (!this.isNotificationConnected() || this.joinedGroupsNotification.size === 0) return;

    await Promise.all(
      Array.from(this.joinedGroupsNotification).map(group => this.leaveNotificationGroup(group))
    );
  }

  public async leaveNotificationGroup(groupName: string): Promise<void> {
    if (!this.isNotificationConnected()) {
      return;
    }

    if (!this.joinedGroupsNotification.has(groupName)) {
      return;
    }

    try {
      await this.hubConnectionNotification?.invoke('LeaveGroup', groupName);
      this.joinedGroupsNotification.delete(groupName);
    } catch (err) {
      console.error(`Erro ao sair do grupo NOTIFICATION ${groupName}:`, err);
      throw err;
    }
  }

  public getQueueConnectionId(): string | null {
    return this.hubConnectionQueue?.connectionId || null;
  }

  public getNotificationConnectionId(): string | null {
    return this.hubConnectionNotification?.connectionId || null;
  }

  public isAnyConnected(): boolean {
    return this.isQueueConnected() || this.isNotificationConnected();
  }
}