import { SimulationService, NewSimulationReq, NewWorkloadReq, PodMeta, WorkloadMeta, SimMeta, PodConfig, StatsForComponent } from './../simulation.service';
import { Component, OnInit } from '@angular/core';
import {FormControl, Validators, FormControlName, FormGroup, ValidatorFn, ValidationErrors, AbstractControl} from '@angular/forms';

const isNumber = (validationId: string) => {
  return (control: AbstractControl): { [key: string]: boolean } => {
    if (isNaN(control.value)) {
      let res = {};
      res[validationId] = true;
      return res;
    }
    return null;
  };
  
}

const getNumValidator = (validationId: string) => isNumber(validationId)

@Component({
  selector: 'app-text-based-manager',
  templateUrl: './text-based-manager.component.html',
  styleUrls: ['./text-based-manager.component.scss']
})
export class TextBasedManagerComponent implements OnInit {

  simulation: SimMeta;
  pods: Pod[] = [];
  podInFocus: Pod;
  private statsIntervalId;

  private podFormStates = {
    name: '',
    maxIOPS: 500,
    storageReadCost: 7,
    storageWriteCost: 10
  };
  podForm = new FormGroup({
    name: new FormControl(this.podFormStates.name, Validators.required),
    maxIOPS: new FormControl(this.podFormStates.maxIOPS, [Validators.required, getNumValidator('maxIOPS')]),
    storageReadCost: new FormControl(this.podFormStates.storageReadCost, [Validators.required, getNumValidator('storageReadCost')]),
    storageWriteCost: new FormControl(this.podFormStates.storageWriteCost, [Validators.required, getNumValidator('storageWriteCost')])
  });

  constructor(private simService: SimulationService) { 

  }

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
    if(this.podForm.status === "INVALID") return;

    const podName = this.podForm.get('name').value as string;
    this.simService.createPod(this.simulation.id, {
      pod: {
        name: podName,
        subsystemManagerConfig: {
          disk: {
            processingFrequency: this.iops2processFreq(this.podForm.get('maxIOPS').value as number),
            requestCapacity: 100,
            costs: {
              read: this.podForm.get('storageReadCost').value as number,
              write: this.podForm.get('storageWriteCost').value as number
            }
          }
         },
         workload: {
          tickInterval: "1 SECONDS"
         }
      }
    }).subscribe(resp => {
      this.podForm.reset(this.podFormStates);
      resp.meta.name = podName;
      this.pods.push(new Pod(resp.meta, [], new PodStats(0)));
    }, console.error);
  }

  createWorkload() {
    if(!this.podInFocus) {
      console.error('No pod selected!');
      return;
    }
    this.simService.createWorkload(
      this.simulation.id,
      this.podInFocus.meta.id,
      new NewWorkloadReq({})
    ).subscribe(resp => {
      this.podInFocus.workloads.push(new Workload(resp.meta));
    }, console.error);
  }

  terminateWorkload(w: Workload) {
    if(!this.podInFocus) {
      console.error('No pod in focus!');
      return;
    }
    const currentPod = this.podInFocus;
    this.simService.stopWorkload(this.simulation.id, currentPod.meta.id, w.meta.id)
      .subscribe(_ => {
        const idx = this.podInFocus.workloads.findIndex(wl => wl.meta.id === w.meta.id)
        if(idx > -1) this.podInFocus.workloads.splice(idx, 1); // Would be weird if not found by hey, I've seen worse
      });
  }

  refreshStats() {
    this.simService.getAllStats(this.simulation.id)
      .subscribe(resp => {
        this.pods.forEach(pod => {
          pod.workloads.forEach(workload => {
            const statsForComp = resp.stats.find(s => s.id === workload.meta.id);
            if(!statsForComp) return;
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
            workload.styleClass = this.getStatsStyleForWorkload(workload);
          });
          this.recalcStatsForPod(pod);
        });
      });
  }

  viewWorkloads(pod: Pod) {
    this.podInFocus = pod;
  }

  terminatePod(pod: Pod) {
    console.log(`Terminating pod ${pod}`);
  }

  viewPods() {
    this.podInFocus = null;
  }

  private getStatsStyleForWorkload(workload: Workload) {
    const storageStats = workload.stats.lastStats.storage;
    const readFailurePercentage = storageStats.readFailure / storageStats.total * 100
    return this.getStatsStyleForLoad(readFailurePercentage);
  }

  private recalcStatsForPod(pod: Pod) {
    const load = pod.workloads.reduce((accum, workload) => {
      const storageStats = workload.stats.lastStats.storage;
      accum.total += storageStats.readFailure / storageStats.total * 100;
      accum.count += 1;
      return accum;
    }, {total: 0, count: 0});
    if(load.count > 0) {
      pod.stats.avgStorageError = load.total / load.count;
      pod.styleClass = this.getStatsStyleForLoad(pod.stats.avgStorageError);
    }
  }

  private getStatsStyleForLoad(loadNum: number): string {
    if(loadNum > 75) return 'high-load';
    else if (loadNum > 5) return 'medium-load';
    else return 'low-load';
  }

  private iops2processFreq(iops: number): { perTick: number, tickSleepDuration: string } {
    return { perTick: Math.round(iops / 10), tickSleepDuration: "100 MILLISECONDS"};
  }
}

class WorkloadStats {
  constructor(public lastStats: StatsForComponent, public allTimeStats: StatsForComponent) {}
}
class Workload {
  constructor(public meta: WorkloadMeta, public stats?: WorkloadStats, public styleClass?: string) {}
}
class PodStats {
  constructor(public avgStorageError: number) {}
}
class Pod {
  constructor(public meta: PodMeta, public workloads: Workload[], public stats: PodStats, public styleClass?: string) {}
}