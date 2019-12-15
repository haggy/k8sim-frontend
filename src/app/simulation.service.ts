import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {

  private baseUrl = 'http://localhost:10001';

  constructor(private http: HttpClient) { }

  createSimulation(req: NewSimulationReq): Observable<NewSimulationResp> {
    return this.http.post<NewSimulationResp>(
      `${this.baseUrl}/simulation`,
      req
    );
  }

  createPod(simulationId: string, req: NewPodReq): Observable<NewPodResp> {
    return this.http.post<NewPodResp>(
      `${this.baseUrl}/simulation/${simulationId}/pod`,
      req
    );
  }

  createWorkload(simulationId: string, podId: string, req: NewWorkloadReq): Observable<NewWorkloadResp> {
    return this.http.post<NewWorkloadResp>(
      `${this.baseUrl}/simulation/${simulationId}/pod/${podId}/workload`,
      req
    );
  }
}

export class NewSimulationReq {
  constructor(public placeholder?: string) {}
}
export class NewSimulationResp {
  constructor(public meta: SimulationMeta) {}
}
export class SimulationMeta {
  constructor(public id: string) {}
}

export class NewPodReq {
 constructor(public pod: {
   subsystemManagerConfig: {
    disk: {
      processingFrequency: {
        perTick: number,
        tickSleepDuration: string
      },
      requestCapacity: number,
      costs: {
        read: number,
        write: number
      }
    }
   },
   workload: {
    tickInterval: string
   }
 }) {}
}
export class NewPodResp {
  constructor(public meta: { id: string }) {}
}

export class NewWorkloadReq {
  constructor(public workload: {}) {}
}
export class NewWorkloadResp {
  constructor(public meta: { id: string }) {}
}