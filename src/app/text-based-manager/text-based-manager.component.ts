import { SimulationService, NewSimulationReq, NewWorkloadReq } from './../simulation.service';
import { Component, OnInit } from '@angular/core';
import { flatMap } from 'rxjs/operators';

@Component({
  selector: 'app-text-based-manager',
  templateUrl: './text-based-manager.component.html',
  styleUrls: ['./text-based-manager.component.scss']
})
export class TextBasedManagerComponent implements OnInit {

  simulationId: string;
  podId: string;
  workloads: Workload[] = [];

  constructor(private simService: SimulationService) { }

  ngOnInit() {
    this.simService.createSimulation(new NewSimulationReq())
      .pipe(flatMap(simResp => {
        this.simulationId = simResp.meta.id;
        return this.simService.createPod(simResp.meta.id, {
          pod: {
            subsystemManagerConfig: {
              disk: {
                processingFrequency: {
                  perTick: 10,
                  tickSleepDuration: "250 MILLISECONDS"
                },
                requestCapacity: 100,
                costs: {
                  read: 7,
                  write: 10
                }
              }
             },
             workload: {
              tickInterval: "100 MILLISECONDS"
             }
          }
        })
      }))
      .pipe(flatMap(podResp => {
        this.podId = podResp.meta.id;
        return this.simService.createWorkload(
          this.simulationId,
          podResp.meta.id,
          new NewWorkloadReq({})
        )
      }))
      .pipe(flatMap(workloadMeta => {
        this.workloads.push(new Workload(workloadMeta.meta.id));
        return this.simService.createWorkload(
          this.simulationId,
          this.podId,
          new NewWorkloadReq({})
        );
      }))
      .subscribe(wm => this.workloads.push(new Workload(wm.meta.id)));
  }

}

class Workload {
  constructor(public id: string) {}
}