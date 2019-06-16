
export class InSceneEditor {
  
  target: IEntity;
  editing: string;
  editTypes: string[] = ["pos", "rot", "scale", "albedoColor"];
  editTypeButtons: {[index: string]: Entity};
  indicators: TextShape[];
  speed: number = 1;
  
  startTransf: Transform;
  startAlbedoCol: Color3;
  
  whatTypeIndicatorText: TextShape;
  
  constructor(target: IEntity, transform: Transform) {
    
    this.target = target;

    // Root entity for our editing board.
    let root = new Entity();
    root.addComponent(transform);
    engine.addEntity(root);
    
    // Board to go under all the buttons.
    let board = new Entity();
    board.addComponent(new BoxShape());
    board.setParent(root);
    board.addComponent(new Transform({
      scale: new Vector3(2.4, 0.1, 1.4)
    }));
    let boardMat = new Material();
    boardMat.albedoColor = new Color3(0.2, 0.2, 0.2);
    board.addComponent(boardMat);
    
    let buttonsTexture = new Texture('materials/dcleditor.png');
    
    // "what you're editing" buttons
    this.editTypeButtons = {};
    for (let i = 0; i < 4; i++) {
      let typeButton = new Entity();
      typeButton.setParent(root);
      let shape = new BoxShape();
      /*
      let shape = new PlaneShape();
      shape.width = 0.15;
      shape.height = 0.15;
      shape.uvs = [
        0.5, 0.125,
        0.625, 0.125,
        0.5, 0.625,
        0.625, 0.625,
        0, 0,
        0, 0,
        0, 0,
        0, 0
      ];
      */
      typeButton.addComponent(shape);
      typeButton.addComponent(new Transform({
        position: new Vector3(i * 0.2 - 1.1, i === 0 ? 0.025 : 0.05, 0.6),
        scale: new Vector3(0.15, 0.1, 0.15)
      }));
      let mat = new Material();
      mat.albedoTexture = buttonsTexture;
      typeButton.addComponent(mat);
      typeButton.addComponent(new OnClick(() => {
        this.editTypeButtons[this.editing].getComponent(Transform).position.y = 0.05;
        this.changeEditType(this.editTypes[i]);
        typeButton.getComponent(Transform).position.y = 0.025;
      }));

      this.editTypeButtons[this.editTypes[i]] = typeButton;
    }
    
    // X Y Z speed +- buttons
    let manipButtonsActions = ["minusX", "minusY", "minusZ", "minusSpeed", "plusX", "plusY", "plusZ", "plusSpeed"];
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 2; y++) {
        let button = new Entity();
        button.setParent(root);
        button.addComponent(new BoxShape());
        button.addComponent(new Transform({
          position: new Vector3(x * 0.4 - 1, 0.05, y * 0.4 - 0.5),
          scale: new Vector3(0.35, 0.1, 0.35)
        }));
        button.addComponent(new OnClick(() => {
          this[manipButtonsActions[x + y * 4]]();
        }));
      }
    }
    
    // x y z speed indicators
    this.indicators = [];
    for (let x = 0; x < 4; x++) {
      let indicator = new Entity();
      indicator.setParent(root);
      let txt = new TextShape();
      txt.color = new Color3(x === 0 || x === 3 ? 1 : 0, x === 1 || x === 3 ? 1: 0, x === 2 || x === 3 ? 1 : 0)
      txt.outlineColor = new Color3(0, 0, 0);
      txt.outlineWidth = 0.001;
      this.indicators.push(txt);
      indicator.addComponent(txt);
      indicator.addComponent(new Transform({
        position: new Vector3(x * 0.4 - 1, 0.1, 0.2),
        scale: new Vector3(0.09, 0.09, 0.09),
        rotation: Quaternion.Euler(90, 0, 0)
      }));
    }
    
    // Export button.
    let exportButton = new Entity();
    exportButton.setParent(root);
    exportButton.addComponent(new BoxShape());
    exportButton.addComponent(new Transform({
      position: new Vector3(0.8, 0.05, -0.5),
      scale: new Vector3(0.75, 0.1, 0.35)
    }));
    exportButton.addComponent(new OnClick(() => {
      this.export();
    }));
    
    // Reset button.
    let resetButton = new Entity();
    resetButton.setParent(root);
    resetButton.addComponent(new BoxShape());
    resetButton.addComponent(new Transform({
      position: new Vector3(0.8, 0.05, -0.1),
      scale: new Vector3(0.75, 0.1, 0.35)
    }));
    resetButton.addComponent(new OnClick(() => {
      this.reset();
    }));
    
    // Save starting values, and make sure target has those components.
    try {
      let targetTransf = target.getComponent(Transform);
      this.startTransf = new Transform({
        position: new Vector3(targetTransf.position.x, targetTransf.position.y, targetTransf.position.z),
        rotation: new Quaternion(targetTransf.rotation.x, targetTransf.rotation.y, targetTransf.rotation.z, targetTransf.rotation.w),
        scale: new Vector3(targetTransf.scale.x, targetTransf.scale.y, targetTransf.scale.z)
      });
    }
    catch(e) {
      this.startTransf = new Transform({
        position: new Vector3(8, 1, 8),
        rotation: new Quaternion(0, 0, 0, 1),
        scale: new Vector3(1, 1, 1)
      });
      this.target.addComponent(new Transform({
        position: new Vector3(this.startTransf.position.x, this.startTransf.position.y, this.startTransf.position.z),
        rotation: new Quaternion(this.startTransf.rotation.x, this.startTransf.rotation.y, this.startTransf.rotation.z, this.startTransf.rotation.w),
        scale: new Vector3(this.startTransf.scale.x, this.startTransf.scale.y, this.startTransf.scale.z)
      }));
    }
    try {
      let targetMat = target.getComponent(Material);
      let albedoCol = targetMat.albedoColor;
      if (albedoCol) {
        this.startAlbedoCol = new Color3(albedoCol.r, albedoCol.g, albedoCol.b);
      }
      else {
        this.startAlbedoCol = new Color3(0.5, 0.5, 0.5);
        targetMat.albedoColor = new Color3(this.startAlbedoCol.r, this.startAlbedoCol.g, this.startAlbedoCol.b);
      }
    }
    catch(e) {
      this.startAlbedoCol = new Color3(0.5, 0.5, 0.5);
      let targetMat = new Material();
      targetMat.albedoColor = new Color3(this.startAlbedoCol.r, this.startAlbedoCol.g, this.startAlbedoCol.b);
      this.target.addComponent(targetMat);
    }
    
    // Finally, change our editing type to get everything updated.
    this.changeEditType("pos");
    
    // Also make sure speed indicator's showing.
    this.indicators[3].value = "" + this.speed;
  }
  
  public changeEditType(newType: string) {
    this.editing = newType;
    switch(this.editing) {
      case "pos": {
        let pos = this.target.getComponent(Transform).position;
        this.updateIndicators(pos.x, pos.y, pos.z);
        break;
      }
      case "scale": {
        let scale = this.target.getComponent(Transform).scale;
        this.updateIndicators(scale.x, scale.y, scale.z);
        break;
      }
      case "rot": {
        let euler = this.target.getComponent(Transform).rotation.eulerAngles;
        this.updateIndicators(euler.x, euler.y, euler.z);
        break;
      }
      case "albedoColor": {
        let col = this.target.getComponent(Material).albedoColor;
        this.updateIndicators(col.r, col.g, col.b);
        break;
      }
    }
  }
  
  public getCorrectField() {
    switch(this.editing) {
      case "pos": return this.target.getComponent(Transform).position;
      case "rot": return this.target.getComponent(Transform).rotation;
      case "scale": return this.target.getComponent(Transform).scale;
      case "albedoColor": return this.target.getComponent(Material).albedoColor;
    }
  }
  
  public updateIndicators(x: number, y: number, z: number) {
    let xVal = "" + (Math.round(x * 1000) / 1000);
    let yVal = "" + (Math.round(y * 1000) / 1000);
    let zVal = "" + (Math.round(z * 1000) / 1000);
    
    if (this.indicators[0].value != xVal) {
      this.indicators[0].value = xVal;
    }
    if (this.indicators[1].value != yVal) {
      this.indicators[1].value = yVal;
    }
    if (this.indicators[2].value != zVal) {
      this.indicators[2].value = zVal;
    }
  }
  
  public change(mx, my, mz, bx, by, bz) {
    let newValues: Vector3;
    let field = this.getCorrectField();
    switch (this.editing) {
      case "pos": {
        let field = this.target.getComponent(Transform).position;
        newValues = new Vector3(field.x * mx + bx, field.y * my + by, field.z * mz + bz);
        field.set(newValues.x, newValues.y, newValues.z);
        break;
      }
      case "rot": {
        let field = this.target.getComponent(Transform).rotation;
        let cur = field.eulerAngles;
        newValues = new Vector3(field.eulerAngles.x * mx + bx * 10, field.eulerAngles.y * my + by * 10, field.eulerAngles.z * mz + bz * 10);
        field.setEuler(newValues.x, newValues.y, newValues.z);
        break;
      }
      case "scale": {
        let field = this.target.getComponent(Transform).scale;
        newValues = new Vector3(field.x * mx + bx, field.y * my + by, field.z * mz + bz);
        field.set(newValues.x, newValues.y, newValues.z);
        break;
      }
      case "albedoColor": {
        log('change albedocolor');
        let field = this.target.getComponent(Material).albedoColor;
        newValues = new Vector3(field.r * mx + bx, field.g * my + by, field.b * mz + bz);
        field.set(newValues.x, newValues.y, newValues.z);
        log(field.r + ', ' + field.g + ', ' + field.b);
        log(this.target.getComponent(Material).albedoColor);
        break;
      }
    }
    this.updateIndicators(newValues.x, newValues.y, newValues.z);
  }
  
  public plusX() {
    this.change(1, 1, 1, this.speed, 0, 0);
  }
  
  public minusX() {
    this.change(1, 1, 1, -this.speed, 0, 0);
  }
  
  public plusY() {
    this.change(1, 1, 1, 0, this.speed, 0);
  }
  
  public minusY() {
    this.change(1, 1, 1, 0, -this.speed, 0);
  }
  
  public plusZ() {
    this.change(1, 1, 1, 0, 0, this.speed);
  }
  
  public minusZ() {
    this.change(1, 1, 1, 0, 0, -this.speed);
  }
  
  public plusSpeed() {
    if (this.speed < 100) {
      this.speed *= 10;
      this.indicators[3].value = "" + this.speed;
    }
  }
  
  public minusSpeed() {
    if (this.speed > 0.001) {
      this.speed /= 10;
      this.indicators[3].value = "" + this.speed;
    }
  }
  
  public export() {
    log ('export');
    let s: string = "";
    
    try {
      let transf = this.target.getComponent(Transform);
      s += `entity.addComponent(new Transform({
        position: new Vector3(` + (Math.round(transf.position.x * 1000) / 1000) + `, ` + (Math.round(transf.position.y * 1000) / 1000) + `, ` + Math.round(transf.position.z * 1000) / 1000 + `),
        rotation: new Quaternion(` + transf.rotation.x + `, ` + transf.rotation.y + `, ` + transf.rotation.z + `, ` + transf.rotation.w + `),
        scale: new Vector3(` + transf.scale.x + `, ` + transf.scale.y + `, ` + transf.scale.z + `)
      }));
      `;
    }
    catch(e) {
      log('transf error');
      log (e);
    }
      
    try {
      let mat = this.target.getComponent(Material);
      s += `let mat = new Material();
      mat.albedoColor = new Vector3(` + mat.albedoColor.r + `, ` + mat.albedoColor.g + `, ` + mat.albedoColor.b + `);
      entity.addComponent(mat);
      `;
    }
    catch(e) {
      log('mat error');
      log (e);
    }
    
    log(s);
  }
  
  public reset() {
    switch(this.editing) {
      case 'pos': {
        this.change(0, 0, 0, this.startTransf.position.x, this.startTransf.position.y, this.startTransf.position.z);
        break;
      }
      case 'rot': {
        let euler = this.startTransf.rotation.eulerAngles;
        this.change(0, 0, 0, euler.x, euler.y, euler.z);
        break;
      }
      case 'scale': {
        this.change(0, 0, 0, this.startTransf.scale.x, this.startTransf.scale.y, this.startTransf.scale.z);
        break;
      }
      case 'albedoColor': {
        this.change(0, 0, 0, this.startAlbedoCol.r, this.startAlbedoCol.g, this.startAlbedoCol.b);
        break;
      }
    }
  }
}
