import { IService, Request, Response, Service } from "../../../mod.ts";

export class ResponseTimeService extends Service implements IService {
  public run_on_error = true;

  #startTime = 0;
  #endTime = 0;

  runBeforeResource() {
    this.#startTime = new Date().getTime();
  }

  runAfterResource(_request: Request, response: Response) {
    this.#logEndTime(response);
  }

  runOnError(_request: Request, response: Response) {
    this.#logEndTime(response);
  }

  #logEndTime(response: Response): void {
    this.#endTime = new Date().getTime();
    const time = (this.#endTime - this.#startTime) + "ms";
    response.headers.set("X-Response-Time", time.toString());
  }
}
