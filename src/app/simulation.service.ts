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

  stopWorkload(simId: string, podId: string, workloadId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/simulation/${simId}/pod/${podId}/workload/${workloadId}`
    );
  }

  getAllStats(simId: string): Observable<AllStatsResp> {
    return this.http.get<AllStatsResp>(`${this.baseUrl}/simulation/${simId}/stats`);
  }
}

export type SimMeta = { id: string };
export type PodMeta = { id: string, name: string };
export type WorkloadMeta = { id: string };
export type PodConfig = {
  name: string,
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
};

export class NewSimulationReq {
  constructor() {}
}
export class NewSimulationResp {
  constructor(public meta: SimMeta) {}
}

export class NewPodReq {
 constructor(public pod: PodConfig) {}
}

export class NewPodResp {
  constructor(public meta: PodMeta) {}
}

export class NewWorkloadReq {
  constructor(public workload: {}) {}
}
export class NewWorkloadResp {
  constructor(public meta: WorkloadMeta) {}
}

export class StorageStats {
  constructor(
    public total: number, 
    public readSuccess: number, 
    public readFailure: number, 
    public writeSuccess: number, 
    public writeFailure: number
  ) {}
}
export class StatsForComponent {
  constructor(public storage: StorageStats) {}
}
export class StatsEntry {
  constructor(public id: string, public stats: StatsForComponent) {}
}
export class AllStatsResp {
  constructor(public stats: StatsEntry[]) {}
}