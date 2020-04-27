import { SimulationService, NewSimulationReq, NewWorkloadReq, PodMeta, WorkloadMeta, SimMeta, PodConfig, StatsForComponent, StorageStats, StatsEntry } from './../simulation.service';
import { Component, OnInit } from '@angular/core';
import {FormControl, Validators, FormControlName, FormGroup, ValidatorFn, ValidationErrors, AbstractControl} from '@angular/forms';
import { group } from '@angular/animations';

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
  workloadGroups: WorkloadGroup[] = [];
  podInFocus: Pod | undefined;
  workloadGroupInFocus: WorkloadGroup | undefined;
  private statsIntervalId;
  activeTab: string = 'sim';

  private podFormStates = {
    name: '',
    maxIOPS: 500,
    storageReadCost: 7,
    storageWriteCost: 10,
    storageQueueCapacity: 100
  };
  podForm = new FormGroup({
    name: new FormControl(this.podFormStates.name, Validators.required),
    maxIOPS: new FormControl(this.podFormStates.maxIOPS, [Validators.required, getNumValidator('maxIOPS')]),
    storageReadCost: new FormControl(this.podFormStates.storageReadCost, [Validators.required, getNumValidator('storageReadCost')]),
    storageWriteCost: new FormControl(this.podFormStates.storageWriteCost, [Validators.required, getNumValidator('storageWriteCost')]),
    storageQueueCapacity: new FormControl(this.podFormStates.storageQueueCapacity, [Validators.required, getNumValidator('storageQueueCapacity')])
  });

  private workloadGroupFormStates = {
    groupName: '',
    numContainers: 1
  };
  workloadGroupForm = new FormGroup({
    groupName: new FormControl(this.workloadGroupFormStates.groupName, Validators.required),
    numContainers: new FormControl(this.workloadGroupFormStates.numContainers, [Validators.required, getNumValidator('numContainers')])
  })

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
    if(this.podForm.status === "INVALID") {
      console.error('Form invalid!');
      return;
    }

    const podName = this.podForm.get('name').value as string;
    this.simService.createPod(this.simulation.id, {
      pod: {
        name: podName,
        subsystemManagerConfig: {
          disk: {
            processingFrequency: this.iops2processFreq(this.podForm.get('maxIOPS').value as number),
            requestCapacity: this.podForm.get('storageQueueCapacity').value as number,
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
    } else if(this.workloadGroupForm.status === "INVALID") {
      console.error('Form invalid!');
      return;
    }

    this.simService.createWorkload(
      this.simulation.id,
      this.podInFocus.meta.id,
      new NewWorkloadReq({
        groupRoleName: this.workloadGroupForm.get('groupName').value as string,
        numContainers: this.workloadGroupForm.get('numContainers').value as number
      })
    ).subscribe(resp => {
      this.workloadGroupForm.reset(this.workloadGroupFormStates);
      const workloads = resp.workloadIds.map((id, idx) => new Workload(id, `${resp.meta.groupRoleName}-${idx}`));
      this.podInFocus.addWorkloadGroup(new WorkloadGroup(resp.meta.groupRoleName, resp.meta.id, workloads));
    }, console.error);
  }

  terminateWorkload(w: Workload) {
    if(!this.workloadGroupInFocus) {
      console.error('No workload group in focus!');
      return;
    }
    const currentPod = this.podInFocus;
    const currentWorkloadGroup = this.workloadGroupInFocus;
    this.simService.stopWorkload(this.simulation.id, currentPod.meta.id, currentWorkloadGroup.id, w.id)
      .subscribe(_ => {
        currentWorkloadGroup.removeWorkload(w)
      });
  }

  refreshStats() {
    this.simService.getAllStats(this.simulation.id)
      .subscribe(resp => {
        this.pods.forEach(pod => {
          pod.workloadGroups.forEach(wlGroup => {
            wlGroup.updateStats(resp.stats);
          });
          pod.recalcStats();
        });
      });
  }

  viewPod(pod: Pod) {
    this.podInFocus = pod;
    this.activeTab = 'wlg';
  }

  viewWorkloadGroup(wlg: WorkloadGroup) {
    this.workloadGroupInFocus = wlg;
  }

  terminatePod(pod: Pod) {
    console.log(`Terminating pod ${pod.meta.id}`);
  }

  terminateGroup(wlg: WorkloadGroup) {
    console.log(`Terminating group ${wlg.id}`);
  }

  viewPods() {
    this.podInFocus = null;
    this.activeTab = 'pod';
  }

  viewWorkloadGroups() {
    this.workloadGroupInFocus = null;
  }

  private iops2processFreq(iops: number): { perTick: number, tickSleepDuration: string } {
    return { perTick: Math.round(iops / 10), tickSleepDuration: "100 MILLISECONDS"};
  }
}

class StatUtils {
  getStatsStyleForLoad(loadNum: number): string {
    if(loadNum > 75) return 'high-load';
    else if (loadNum > 5) return 'medium-load';
    else return 'low-load';
  }
}

class WorkloadStats {
  constructor(public lastStats: StatsForComponent, public allTimeStats: StatsForComponent) {}
}
class Workload {
  constructor(public id: string, public displayName: string, public stats?: WorkloadStats, public styleClass?: string) {}
}
class PodStats {
  constructor(public avgStorageError: number) {}
}
class Pod extends StatUtils {
  numWorkloads: number;
  constructor(public meta: PodMeta, public workloadGroups: WorkloadGroup[], public stats: PodStats, public styleClass?: string) {
    super();
    this.numWorkloads = 0;
    this.workloadGroups.forEach(this.updateNumWorkloads.bind(this));
  }

  addWorkloadGroup(wg: WorkloadGroup) {
    this.workloadGroups.push(wg);
    this.updateNumWorkloads(wg);
  }

  workloadCount() { return this.numWorkloads; }

  private updateNumWorkloads(wg: WorkloadGroup) {
    this.numWorkloads += wg.workloads.length;
  }

  recalcStats() {
    const load = this.workloadGroups.reduce((accum, wlGroup) => {
      accum.total += wlGroup.getStats().avgStorageError;
      accum.count += 1;
      return accum;
    }, {total: 0, count: 0});
    if(load.count > 0) {
      this.stats.avgStorageError = load.total / load.count;
      this.styleClass = this.getStatsStyleForLoad(this.stats.avgStorageError);
    }
  }
}
class WorkloadGroupStats {
  constructor(public avgStorageError: number, storage: StorageStats) {}
}
class WorkloadGroup extends StatUtils {
  size: number;
  stats: WorkloadGroupStats;
  public styleClass: string = 'low-load';

  constructor(public name: string, public id: string, public workloads: Workload[]) {
    super();
    this.size = workloads.length;
    this.stats = new WorkloadGroupStats(
      0,
      new StorageStats(0, 0, 0, 0, 0)
    );
  }

  workloadCount() { return this.size; }

  getWorkloadById(id: string): Workload | undefined { return this.workloads.find(wl => wl.id === id); }

  removeWorkload(w: Workload): void {
    const idx = this.workloads.findIndex(wl => wl.id === w.id);
    if(idx >= 0) this.workloads.splice(idx, 1);
  }

  getStats() { return this.stats; }

  updateStats(statsEntries: StatsEntry[]): void {
    this.workloads.forEach(workload => {
      const statsForComp = statsEntries.find(s => s.id === workload.id);
      if(!statsForComp) {
        if(!workload.stats) {
          // just add empty stats
          const empty = new StatsForComponent(new StorageStats(0, 0, 0, 0, 0));
          workload.stats = new WorkloadStats(empty, empty);
        }
        return;
      }

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
    this.recalcStats();
  }

  private recalcStats() {
    const load = this.workloads.reduce((accum, wl) => {
      const storageStats = wl.stats.lastStats.storage;
      accum.total += storageStats.readFailure / Math.max(storageStats.total, 1) * 100;
      accum.count += 1;
      return accum;
    }, {total: 0, count: 0});
    if(load.count > 0) {
      this.stats.avgStorageError = load.total / load.count;
      this.styleClass = this.getStatsStyleForLoad(this.stats.avgStorageError);
    }
  }

  private getStatsStyleForWorkload(workload: Workload) {
    const storageStats = workload.stats.lastStats.storage;
    const readFailurePercentage = storageStats.readFailure / storageStats.total * 100
    return this.getStatsStyleForLoad(readFailurePercentage);
  }
}