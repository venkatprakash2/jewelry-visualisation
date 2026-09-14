"""Generate intentionally approximate showroom ring and kada GLBs.

Run with: /Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/generate_jewelry_models.py
The product catalogue photographs remain the authoritative detail source.
"""
import bpy
from math import pi
from pathlib import Path

out = Path(__file__).resolve().parents[1] / 'public' / 'models'
out.mkdir(parents=True, exist_ok=True)

def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def metal():
    m = bpy.data.materials.new('Warm 22KT gold')
    m.diffuse_color = (0.72, 0.39, 0.04, 1)
    m.metallic, m.roughness = .9, .22
    return m

def export(name):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(out / name), export_format='GLB', export_materials='EXPORT')

clear(); gold = metal()
bpy.ops.mesh.primitive_torus_add(major_radius=.056, minor_radius=.009, major_segments=48, minor_segments=12, rotation=(pi / 2, 0, 0))
bpy.context.object.data.materials.append(gold)
bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=.021, location=(0,.056,0))
stone = bpy.data.materials.new('Approximate diamond'); stone.diffuse_color=(.92,.96,1,1); stone.metallic=.15; stone.roughness=.08
bpy.context.object.data.materials.append(stone); export('approximate-solitaire-ring.glb')

clear(); gold = metal()
bpy.ops.mesh.primitive_torus_add(major_radius=.14, minor_radius=.016, major_segments=64, minor_segments=12, rotation=(pi / 2, 0, 0))
bpy.context.object.data.materials.append(gold); export('approximate-kada-bangle.glb')
