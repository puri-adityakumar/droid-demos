"""
Procedural Blender 4.2 asset generator for Soren Lindqvist 3D Industrial Design Portfolio.
Generates 3 intricate multi-part PBR .glb models from scratch using bpy, all < 300 KB:
  1. kestrel-recorder.glb    — Coaxial Acoustic Field Recorder (Hero & Case 01)
  2. verge-monochromator.glb — Precision Optical Monochromator Turret (Case 02)
  3. aether-gimbal.glb       — 3-Axis Gyroscopic Sensor Head (Case 03)

Each model exposes 5 named mechanical sub-assemblies:
  - part_01_chassis
  - part_02_capsule_guard
  - part_03_transducer_core
  - part_04_rotary_gain
  - part_05_bayonet_mount
"""

import bpy
import math
import os

OUT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "public", "models")
)
os.makedirs(OUT_DIR, exist_ok=True)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def make_pbr_material(name, base_color, metallic=0.88, roughness=0.22, emission=None):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if emission:
            if "Emission Color" in bsdf.inputs:
                bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = 2.0
    return mat


def create_palette():
    return {
        "obsidian": make_pbr_material("Anodized_Obsidian", (0.09, 0.10, 0.12), metallic=0.90, roughness=0.26),
        "titanium": make_pbr_material("Brushed_Titanium", (0.72, 0.75, 0.79), metallic=0.95, roughness=0.16),
        "steel": make_pbr_material("Machined_Steel", (0.86, 0.88, 0.91), metallic=0.98, roughness=0.11),
        "brass": make_pbr_material("Raw_Brass", (0.88, 0.69, 0.30), metallic=0.96, roughness=0.18),
        "copper": make_pbr_material("Coil_Copper", (0.84, 0.45, 0.25), metallic=0.94, roughness=0.20),
        "vermilion": make_pbr_material("Signal_Vermilion", (0.96, 0.28, 0.14), metallic=0.35, roughness=0.28, emission=(0.45, 0.08, 0.02)),
        "ceramic": make_pbr_material("Technical_Ceramic", (0.92, 0.91, 0.88), metallic=0.12, roughness=0.15),
    }


def polish_mesh(obj, bevel_width=0.018, segments=2):
    bpy.context.view_layer.objects.active = obj
    mod = obj.modifiers.new(name="Bevel", type="BEVEL")
    mod.width = bevel_width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(32)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.shade_smooth()


def assign_mat(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def join_into(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    merged = bpy.context.active_object
    merged.name = name
    bpy.ops.object.shade_smooth()
    bpy.ops.object.select_all(action="DESELECT")
    return merged


def export_glb(filename):
    path = os.path.join(OUT_DIR, filename)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
    )
    print(f"Exported {path} ({os.path.getsize(path)} bytes)")


def build_kestrel_recorder():
    """
    Model 1: Kestrel-01 Coaxial Acoustic Field Recorder (< 300 KB).
    Intricate CNC milled body with cooling fins, hex cap screws, stepped titanium cage,
    perforated brass condenser capsule, knurled rotary gain turret, and XLR bayonet collar.
    """
    reset_scene()
    mats = create_palette()

    # 1. CNC Billet Chassis with heat-dissipation fins, titanium side rails & hex bolts
    chassis_objs = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.66, depth=1.48, location=(0, 0, -0.22))
    body = bpy.context.active_object
    polish_mesh(body, bevel_width=0.035, segments=2)
    assign_mat(body, mats["obsidian"])
    chassis_objs.append(body)

    # Machined horizontal cooling ribs around chassis
    for z_rib in [-0.72, -0.52, -0.32, 0.18, 0.34]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.685, depth=0.045, location=(0, 0, z_rib))
        rib = bpy.context.active_object
        polish_mesh(rib, bevel_width=0.008, segments=1)
        assign_mat(rib, mats["titanium"] if z_rib > 0 else mats["obsidian"])
        chassis_objs.append(rib)

    # Side structural stiffening rails + socket cap bolts
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side * 0.67, 0, -0.22))
        rail = bpy.context.active_object
        rail.scale = (0.09, 0.26, 1.34)
        bpy.ops.object.transform_apply(scale=True)
        polish_mesh(rail, bevel_width=0.015, segments=1)
        assign_mat(rail, mats["titanium"])
        chassis_objs.append(rail)

        for bz in (-0.68, 0.24):
            bpy.ops.mesh.primitive_cylinder_add(
                vertices=6,
                radius=0.055,
                depth=0.06,
                location=(side * 0.76, 0, bz),
                rotation=(0, math.radians(90), 0),
            )
            bolt = bpy.context.active_object
            assign_mat(bolt, mats["brass"])
            chassis_objs.append(bolt)

    join_into(chassis_objs, "part_01_chassis")

    # 2. Stepped Titanium Acoustic Guard Cage (upper Z)
    cage_objs = []
    for i, z in enumerate([0.68, 0.88, 1.08, 1.26]):
        r = 0.62 - i * 0.04
        bpy.ops.mesh.primitive_torus_add(
            major_radius=r,
            minor_radius=0.032,
            major_segments=32,
            minor_segments=12,
            location=(0, 0, z),
        )
        ring = bpy.context.active_object
        assign_mat(ring, mats["titanium"])
        cage_objs.append(ring)

    # Top crown cap ring
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.44, depth=0.05, location=(0, 0, 1.38))
    crown = bpy.context.active_object
    polish_mesh(crown, bevel_width=0.01, segments=1)
    assign_mat(crown, mats["steel"])
    cage_objs.append(crown)

    for angle_deg in range(0, 360, 45):
        ang = math.radians(angle_deg)
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=12,
            radius=0.026,
            depth=0.76,
            location=(math.cos(ang) * 0.56, math.sin(ang) * 0.56, 0.98),
        )
        strut = bpy.context.active_object
        assign_mat(strut, mats["steel"])
        cage_objs.append(strut)

    join_into(cage_objs, "part_02_capsule_guard")

    # 3. Brass Condenser Transducer Core with acoustic phase rings
    core_objs = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.38, depth=0.44, location=(0, 0, 0.88))
    diaphragm = bpy.context.active_object
    polish_mesh(diaphragm, bevel_width=0.02, segments=2)
    assign_mat(diaphragm, mats["brass"])
    core_objs.append(diaphragm)

    for z_phase in (0.78, 0.92, 1.06):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.395,
            minor_radius=0.016,
            major_segments=28,
            minor_segments=10,
            location=(0, 0, z_phase),
        )
        pring = bpy.context.active_object
        assign_mat(pring, mats["copper"])
        core_objs.append(pring)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=14, radius=0.26, location=(0, 0, 1.15))
    dome = bpy.context.active_object
    assign_mat(dome, mats["copper"])
    core_objs.append(dome)

    join_into(core_objs, "part_03_transducer_core")

    # 4. Knurled Rotary Gain Dial + Vermilion Datum Lock (front Y)
    dial_objs = []
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=32,
        radius=0.35,
        depth=0.22,
        location=(0, -0.74, -0.06),
        rotation=(math.radians(90), 0, 0),
    )
    dial = bpy.context.active_object
    polish_mesh(dial, bevel_width=0.02, segments=2)
    assign_mat(dial, mats["steel"])
    dial_objs.append(dial)

    # Knurled perimeter teeth on rotary dial
    for deg in range(0, 360, 30):
        rad = math.radians(deg)
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=8,
            radius=0.026,
            depth=0.20,
            location=(math.cos(rad) * 0.35, -0.74, -0.06 + math.sin(rad) * 0.35),
            rotation=(math.radians(90), 0, 0),
        )
        tooth = bpy.context.active_object
        assign_mat(tooth, mats["obsidian"])
        dial_objs.append(tooth)

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=20,
        radius=0.12,
        depth=0.28,
        location=(0, -0.82, 0.12),
        rotation=(math.radians(90), 0, 0),
    )
    pin = bpy.context.active_object
    polish_mesh(pin, bevel_width=0.012, segments=1)
    assign_mat(pin, mats["vermilion"])
    dial_objs.append(pin)

    join_into(dial_objs, "part_04_rotary_gain")

    # 5. Lower CNC Bayonet Mount & XLR Telemetry Collar (lower Z)
    base_objs = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.58, depth=0.34, location=(0, 0, -1.18))
    collar = bpy.context.active_object
    polish_mesh(collar, bevel_width=0.022, segments=2)
    assign_mat(collar, mats["titanium"])
    base_objs.append(collar)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.60,
        minor_radius=0.026,
        major_segments=32,
        minor_segments=12,
        location=(0, 0, -1.01),
    )
    accent_ring = bpy.context.active_object
    assign_mat(accent_ring, mats["vermilion"])
    base_objs.append(accent_ring)

    for px, py in [(-0.18, -0.1), (0.18, -0.1), (0.0, 0.2)]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.048, depth=0.36, location=(px, py, -1.42))
        xlr_pin = bpy.context.active_object
        assign_mat(xlr_pin, mats["brass"])
        base_objs.append(xlr_pin)

    join_into(base_objs, "part_05_bayonet_mount")
    export_glb("kestrel-recorder.glb")


def build_verge_monochromator():
    """
    Model 2: Verge-M2 Optical Monochromator Turret (< 300 KB).
    """
    reset_scene()
    mats = create_palette()

    # 1. Optical Bench Block with side mounting flanges
    block_objs = []
    bpy.ops.mesh.primitive_cube_add(size=1.35, location=(0, 0, 0))
    body = bpy.context.active_object
    body.scale = (1.05, 0.82, 0.78)
    bpy.ops.object.transform_apply(scale=True)
    polish_mesh(body, bevel_width=0.05, segments=3)
    assign_mat(body, mats["obsidian"])
    block_objs.append(body)

    for sx in (-0.68, 0.68):
        for sz in (-0.36, 0.36):
            bpy.ops.mesh.primitive_cylinder_add(
                vertices=12,
                radius=0.055,
                depth=0.12,
                location=(sx, -0.56, sz),
                rotation=(math.radians(90), 0, 0),
            )
            boss = bpy.context.active_object
            assign_mat(boss, mats["brass"])
            block_objs.append(boss)

    join_into(block_objs, "part_01_chassis")

    # 2. Diffraction Turret Wheel (top Z)
    turret_objs = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=36, radius=0.68, depth=0.24, location=(0, 0, 0.72))
    wheel = bpy.context.active_object
    polish_mesh(wheel, bevel_width=0.02, segments=2)
    assign_mat(wheel, mats["titanium"])
    turret_objs.append(wheel)

    for a in range(0, 360, 60):
        rad = math.radians(a)
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=20,
            radius=0.14,
            depth=0.28,
            location=(math.cos(rad) * 0.42, math.sin(rad) * 0.42, 0.74),
        )
        cell = bpy.context.active_object
        assign_mat(cell, mats["brass"] if a == 0 else mats["steel"])
        turret_objs.append(cell)

    join_into(turret_objs, "part_02_capsule_guard")

    # 3. Collimator Objective Barrel (front Y)
    barrel_objs = []
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=36,
        radius=0.44,
        depth=0.58,
        location=(0, -0.82, 0.0),
        rotation=(math.radians(90), 0, 0),
    )
    barrel = bpy.context.active_object
    polish_mesh(barrel, bevel_width=0.022, segments=2)
    assign_mat(barrel, mats["steel"])
    barrel_objs.append(barrel)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.45,
        minor_radius=0.024,
        major_segments=32,
        minor_segments=12,
        location=(0, -0.96, 0.0),
        rotation=(math.radians(90), 0, 0),
    )
    ring = bpy.context.active_object
    assign_mat(ring, mats["vermilion"])
    barrel_objs.append(ring)

    join_into(barrel_objs, "part_03_transducer_core")

    # 4. Micrometer Wavelength Drum (right X)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=32,
        radius=0.28,
        depth=0.52,
        location=(0.95, 0, 0.08),
        rotation=(0, math.radians(90), 0),
    )
    drum = bpy.context.active_object
    drum.name = "part_04_rotary_gain"
    polish_mesh(drum, bevel_width=0.02, segments=2)
    assign_mat(drum, mats["brass"])

    # 5. Kinematic Baseplate (bottom Z)
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.88, depth=0.18, location=(0, 0, -0.68))
    plate = bpy.context.active_object
    plate.name = "part_05_bayonet_mount"
    polish_mesh(plate, bevel_width=0.02, segments=2)
    assign_mat(plate, mats["ceramic"])

    export_glb("verge-monochromator.glb")


def build_aether_gimbal():
    """
    Model 3: Aether-G9 3-Axis Gyroscopic Sensor Head (< 300 KB).
    """
    reset_scene()
    mats = create_palette()

    # 1. Outer Gimbal Yoke + bearing trunnions
    outer_objs = []
    bpy.ops.mesh.primitive_torus_add(
        major_radius=1.02,
        minor_radius=0.075,
        major_segments=48,
        minor_segments=18,
        location=(0, 0, 0),
    )
    outer = bpy.context.active_object
    assign_mat(outer, mats["obsidian"])
    outer_objs.append(outer)

    for sx in (-1.02, 1.02):
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=16,
            radius=0.11,
            depth=0.22,
            location=(sx, 0, 0),
            rotation=(0, math.radians(90), 0),
        )
        trunnion = bpy.context.active_object
        assign_mat(trunnion, mats["titanium"])
        outer_objs.append(trunnion)

    join_into(outer_objs, "part_01_chassis")

    # 2. Pitch Gimbal Ring
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.78,
        minor_radius=0.058,
        major_segments=48,
        minor_segments=16,
        location=(0, 0, 0),
        rotation=(math.radians(55), math.radians(20), 0),
    )
    pitch = bpy.context.active_object
    pitch.name = "part_02_capsule_guard"
    assign_mat(pitch, mats["titanium"])
    bpy.ops.object.shade_smooth()

    # 3. Inertial Brass Core Sphere + Equatorial Optical Band
    core_objs = []
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=0.42, location=(0, 0, 0))
    core = bpy.context.active_object
    polish_mesh(core, bevel_width=0.008, segments=1)
    assign_mat(core, mats["brass"])
    core_objs.append(core)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.43,
        minor_radius=0.022,
        major_segments=32,
        minor_segments=12,
        location=(0, 0, 0),
    )
    eq_band = bpy.context.active_object
    assign_mat(eq_band, mats["obsidian"])
    core_objs.append(eq_band)

    join_into(core_objs, "part_03_transducer_core")

    # 4. Roll Calibration Ring (Vermilion)
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.58,
        minor_radius=0.036,
        major_segments=40,
        minor_segments=14,
        location=(0, 0, 0),
        rotation=(math.radians(-35), math.radians(65), 0),
    )
    roll = bpy.context.active_object
    roll.name = "part_04_rotary_gain"
    assign_mat(roll, mats["vermilion"])
    bpy.ops.object.shade_smooth()

    # 5. Stator Pedestal Base
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.52, depth=0.28, location=(0, 0, -1.18))
    pedestal = bpy.context.active_object
    pedestal.name = "part_05_bayonet_mount"
    polish_mesh(pedestal, bevel_width=0.022, segments=2)
    assign_mat(pedestal, mats["steel"])

    export_glb("aether-gimbal.glb")


if __name__ == "__main__":
    build_kestrel_recorder()
    build_verge_monochromator()
    build_aether_gimbal()
