
import {InSceneEditor} from 'InSceneEditor';



let target = new Entity();
target.addComponent(new BoxShape());
target.addComponent(new Transform({
  position: new Vector3(8, 1, 8)
}));
engine.addEntity(target);
new InSceneEditor(target, new Transform({
  position: new Vector3(8, 0, 4)
}));
