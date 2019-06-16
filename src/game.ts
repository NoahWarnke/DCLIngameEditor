
import {InSceneEditor} from 'InSceneEditor';



let target = new Entity();
target.addComponent(new BoxShape());
target.addComponent(new Transform({
  position: new Vector3(8, 2, 8)
}));
engine.addEntity(target);
new InSceneEditor(target, new Transform({
  position: new Vector3(8, 0.7, 6),
  rotation: Quaternion.Euler(-45, 0, 0)
}));
