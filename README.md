# Casa 3D con modelo GLB

Visor 3D gratuito para GitHub Pages. La escena carga un modelo `.glb` optimizado y permite verlo con controles de cámara desde navegador, celular o TV compatible con WebGL.

## Qué incluye

- Visor 3D con Three.js.
- Carga de modelo externo en formato GLB desde `models/casa-mejor.glb`.
- Reescalado y centrado automático del modelo.
- Iluminación, sombras, fondo, piso y rejilla de referencia.
- Controles:
  - Mouse/touch: rotar.
  - Rueda/pellizco: zoom.
  - WASD o flechas: moverte.
  - Q/E: subir o bajar cámara.
  - Pantalla completa.

## Archivo del modelo

El visor busca el modelo en esta ruta:

```txt
models/casa-mejor.glb
```

Si el modelo no está en esa carpeta, la página mostrará una casa de respaldo creada por código para evitar que el visor quede vacío.

## Publicar con GitHub Pages

En el repositorio:

1. Ve a **Settings > Pages**.
2. En **Source**, selecciona **Deploy from a branch**.
3. Branch: `main`.
4. Folder: `/ (root)`.
5. Guarda.

La URL quedará parecida a:

```txt
https://jcoorp.github.io/mr/
```
