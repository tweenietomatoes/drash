import { Types, Interfaces, Resource, Request, Response } from "../../mod.ts";

export class Service implements Interfaces.IService {
  /**
   * Set up everything that is required for this service to run.
   */
  public setUp(options: Interfaces.IServiceOptions): void {}

  public runAfterResource(_request: Request, _response: Response): void {}

  public runBeforeResource(_request: Request, _response: Response): void {}
}
