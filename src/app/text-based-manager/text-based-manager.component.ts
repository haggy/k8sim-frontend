import { SimulationService, NewSimulationReq, NewWorkloadReq, PodMeta, WorkloadMeta, SimMeta, PodConfig, StatsForComponent } from './../simulation.service';
import { Component, OnInit } from '@angular/core';
import { flatMap } from 'rxjs/operators';

@Component({
  selector: 'app-text-based-manager',
  templateUrl: './text-based-manager.component.html',
  styleUrls: ['./text-based-manager.component.scss']
})
export class TextBasedManagerComponent implements OnInit {

  simulation: SimMeta;
  pod: PodMeta;
  workloads: Workload[] = [];
  private statsIntervalId;

  constructor(private simService: SimulationService) { }

  ngOnInit() {
    
  }

  private startStats() {
    this.statsIntervalId = setInterval(() => this.refreshStats(), 5000);
  }

  createSimulation() {
    this.simService.createSimulation(new NewSimulationReq())
      .subscribe(resp => {
        this.simulation = resp.meta;
        this.startStats();
      }, console.error);
  }

  createPod() {
    this.simService.createPod(this.simulation.id, {
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
          tickInterval: "1 SECONDS"
         }
      }
    }).subscribe(resp => this.pod = resp.meta, console.error);
  }

  createWorkload() {
    this.simService.createWorkload(
      this.simulation.id,
      this.pod.id,
      new NewWorkloadReq({})
    ).subscribe(resp => {
      this.workloads.push(new Workload(resp.meta));
    }, console.error);
  }

  terminateWorkload(simId: string, podId: string, w: Workload) {
    this.simService.stopWorkload(simId, podId, w.meta.id)
      .subscribe(_ => {
        const idx = this.workloads.findIndex(wl => wl.meta.id === w.meta.id)
        if(idx > -1) this.workloads.splice(idx, 1); // Would be weird if not found by hey, I've seen worse
      });
  }

  refreshStats() {
    this.simService.getAllStats(this.simulation.id)
      .subscribe(resp => {
        resp.stats.forEach(statsForComp => {
          const workload = this.workloads.find(w => w.meta.id === statsForComp.id);
          if(workload.stats) {
            workload.stats.lastStats = statsForComp.stats;
            workload.stats.allTimeStats.storage.total += statsForComp.stats.storage.total;
            workload.stats.allTimeStats.storage.readSuccess += statsForComp.stats.storage.readSuccess;
            workload.stats.allTimeStats.storage.readFailure += statsForComp.stats.storage.readFailure;
            workload.stats.allTimeStats.storage.writeSuccess += statsForComp.stats.storage.writeSuccess;
            workload.stats.allTimeStats.storage.writeFailure += statsForComp.stats.storage.writeFailure;
          } else {
            workload.stats = new WorkloadStats(statsForComp.stats, statsForComp.stats);
          }
          workload.styleClass = this.getStatsStyle(workload);
        })
      });
  }

  private getStatsStyle(workload: Workload): string {
    const stats = workload.stats;
    const readFailurePercentage = stats.lastStats.storage.readFailure / stats.lastStats.storage.total * 100
    if(readFailurePercentage > 75) return 'high-load';
    else if (readFailurePercentage > 5) return 'medium-load';
    else return 'low-load';
  }
}

class WorkloadStats {
  constructor(public lastStats: StatsForComponent, public allTimeStats: StatsForComponent) {}
}
class Workload {
  constructor(public meta: WorkloadMeta, public stats?: WorkloadStats, public styleClass?: string) {}
}