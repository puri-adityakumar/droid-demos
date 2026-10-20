"""
Procedural Blender 4.2 asset generator for KOBO ROAST LAB (Specialty Coffee Roastery & Cafe).
Generates 4 original multi-part PBR .glb models from scratch using bpy (all < 300 KB):
  1. kobo-lever-espresso.glb — Asset 01: Brass & Walnut Manual Lever Espresso Machine
  2. kobo-pourover-set.glb   — Asset 02: Fluted Porcelain V60 Pour-Over, Carafe & Copper Kettle
  3. kobo-stoneware-cup.glb  — Asset 03: Speckled Stoneware Cappuccino Cup & Rosetta Latte Art
  4. kobo-coffee-pouch.glb   — Asset 04: Embossed White-Kraft Coffee Pouch & Floating Beans

Each model exposes 5 named interactive sub-assemblies:
  - part_01_base
  - part_02_body
  - part_03_top
  - part_04_accent
  - part_05_vessel
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


def srgb_to_linear(rgb):
    """Convert sRGB (0..1) tuple to Blender linear RGB."""
    return tuple(
        c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
        for c in rgb
    )


def make_pbr_material(name, srgb_color, metallic=0.0, roughness=0.35, alpha=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    lin = srgb_to_linear(srgb_color)
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*lin, alpha)
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if alpha < 1.0 and "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = alpha
            mat.blend_method = "BLEND"
    return mat


def create_palette():
    return {
        "brass": make_pbr_material("Brushed_Brass", (0.85, 0.65, 0.28), metallic=0.90, roughness=0.22),
        "copper": make_pbr_material("Rose_Copper", (0.83, 0.45, 0.28), metallic=0.90, roughness=0.20),
        "steel": make_pbr_material("Polished_Steel", (0.82, 0.84, 0.86), metallic=0.92, roughness=0.18),
        "walnut": make_pbr_material("Turned_Walnut", (0.29, 0.16, 0.09), metallic=0.02, roughness=0.46),
        "porcelain": make_pbr_material("Porcelain_Cream", (0.96, 0.94, 0.90), metallic=0.02, roughness=0.20),
        "stoneware": make_pbr_material("Speckled_Stoneware", (0.87, 0.82, 0.73), metallic=0.02, roughness=0.38),
        "white_kraft": make_pbr_material("White_Kraft", (0.89, 0.83, 0.74), metallic=0.0, roughness=0.58),
        "natural_kraft": make_pbr_material("Natural_Kraft", (0.64, 0.48, 0.33), metallic=0.0, roughness=0.62),
        "crema": make_pbr_material("Espresso_Crema", (0.62, 0.34, 0.12), metallic=0.04, roughness=0.24),
        "roast_bean": make_pbr_material("Espresso_Roast", (0.19, 0.10, 0.06), metallic=0.05, roughness=0.34),
        "amber_coffee": make_pbr_material("Amber_Coffee", (0.42, 0.14, 0.04), metallic=0.04, roughness=0.14),
        "glass": make_pbr_material("Borosilicate_Glass", (0.88, 0.93, 0.96), metallic=0.10, roughness=0.08, alpha=0.38),
        "terracotta": make_pbr_material("Terracotta_Glaze", (0.76, 0.33, 0.18), metallic=0.04, roughness=0.30),
        "obsidian": make_pbr_material("Matte_Obsidian", (0.15, 0.11, 0.09), metallic=0.25, roughness=0.38),
    }


def polish_mesh(obj, bevel_width=0.015, segments=2):
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


def build_lever_espresso():
    """
    Asset 01: KOBO Brass & Walnut Manual Lever Espresso Machine.
    """
    reset_scene()
    mats = create_palette()

    # 1. part_01_base: Turned Walnut Base Plinth + Brass Feet + Brass Drip Tray
    base_objs = []
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.05, -0.98))
    plinth = bpy.context.active_object
    plinth.scale = (1.18, 1.42, 0.24)
    bpy.ops.object.transform_apply(scale=True)
    polish_mesh(plinth, bevel_width=0.035, segments=2)
    assign_mat(plinth, mats["walnut"])
    base_objs.append(plinth)

    # 4 Brass Feet
    for fx in (-0.46, 0.46):
        for fy in (-0.58, 0.48):
            bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.075, depth=0.08, location=(fx, fy, -1.12))
            foot = bpy.context.active_object
            assign_mat(foot, mats["brass"])
            base_objs.append(foot)

    # Recessed Espresso Drip Basin + Brass Grill Bars
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.24, -0.85))
    basin = bpy.context.active_object
    basin.scale = (0.94, 0.80, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    assign_mat(basin, mats["obsidian"])
    base_objs.append(basin)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.24, -0.83))
    tray = bpy.context.active_object
    tray.scale = (0.90, 0.76, 0.025)
    bpy.ops.object.transform_apply(scale=True)
    polish_mesh(tray, bevel_width=0.008, segments=1)
    assign_mat(tray, mats["brass"])
    base_objs.append(tray)

    # Front Brass & Terracotta KOBO Badge
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.77, -0.98))
    plate = bpy.context.active_object
    plate.scale = (0.36, 0.02, 0.09)
    bpy.ops.object.transform_apply(scale=True)
    assign_mat(plate, mats["brass"])
    base_objs.append(plate)

    join_into(base_objs, "part_01_base")

    # 2. part_02_body: Vertical Brushed Brass Boiler Column + Cap + Rear Spine
    body_objs = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.42, depth=1.42, location=(0, 0.22, -0.12))
    boiler = bpy.context.active_object
    polish_mesh(boiler, bevel_width=0.02, segments=2)
    assign_mat(boiler, mats["brass"])
    body_objs.append(boiler)

    # Decorative boiler collar rings
    for rz in (-0.78, 0.46, 0.58):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.43,
            minor_radius=0.022,
            major_segments=32,
            minor_segments=10,
            location=(0, 0.22, rz),
        )
        ring = bpy.context.active_object
        assign_mat(ring, mats["brass"])
        body_objs.append(ring)

    # Sight-glass tube on right side of boiler
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.032, depth=0.76, location=(0.45, 0.14, -0.10))
    sight = bpy.context.active_object
    assign_mat(sight, mats["glass"])
    body_objs.append(sight)

    # Top boiler walnut & brass finial cap
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.14, depth=0.12, location=(0, 0.22, 0.64))
    finial_base = bpy.context.active_object
    polish_mesh(finial_base, bevel_width=0.015, segments=1)
    assign_mat(finial_base, mats["walnut"])
    body_objs.append(finial_base)

    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.08, depth=0.14, location=(0, 0.22, 0.74))
    finial = bpy.context.active_object
    polish_mesh(finial, bevel_width=0.015, segments=1)
    assign_mat(finial, mats["brass"])
    body_objs.append(finial)

    # Rear dark structural column
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.56, -0.14))
    spine = bpy.context.active_object
    spine.scale = (0.52, 0.26, 1.32)
    bpy.ops.object.transform_apply(scale=True)
    polish_mesh(spine, bevel_width=0.025, segments=2)
    assign_mat(spine, mats["obsidian"])
    body_objs.append(spine)

    join_into(body_objs, "part_02_body")

    # 3. part_03_top: Grouphead Bell + Manual Piston Lever Arm & Turned Walnut Handle
    top_objs = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=0.24, depth=0.62, location=(0, -0.26, 0.08))
    group = bpy.context.active_object
    polish_mesh(group, bevel_width=0.018, segments=2)
    assign_mat(group, mats["brass"])
    top_objs.append(group)

    # Copper accent collar on grouphead
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.245,
        minor_radius=0.018,
        major_segments=28,
        minor_segments=10,
        location=(0, -0.26, -0.16),
    )
    g_ring = bpy.context.active_object
    assign_mat(g_ring, mats["copper"])
    top_objs.append(g_ring)

    # Bridge connecting boiler to grouphead
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.04, 0.18))
    bridge = bpy.context.active_object
    bridge.scale = (0.28, 0.44, 0.28)
    bpy.ops.object.transform_apply(scale=True)
    polish_mesh(bridge, bevel_width=0.015, segments=1)
    assign_mat(bridge, mats["brass"])
    top_objs.append(bridge)

    # Angled Brass Lever Rod
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=16,
        radius=0.042,
        depth=0.82,
        location=(0, -0.34, 0.58),
        rotation=(math.radians(42), 0, 0),
    )
    lever_rod = bpy.context.active_object
    assign_mat(lever_rod, mats["brass"])
    top_objs.append(lever_rod)

    # Turned Walnut Lever Grip
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=20,
        radius=0.078,
        depth=0.48,
        location=(0, -0.62, 0.88),
        rotation=(math.radians(42), 0, 0),
    )
    lever_grip = bpy.context.active_object
    polish_mesh(lever_grip, bevel_width=0.02, segments=2)
    assign_mat(lever_grip, mats["walnut"])
    top_objs.append(lever_grip)

    join_into(top_objs, "part_03_top")

    # 4. part_04_accent: Portafilter + Walnut Handle + Side Pressure Gauge + Steam Wand
    acc_objs = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.22, depth=0.14, location=(0, -0.26, -0.24))
    basket = bpy.context.active_object
    polish_mesh(basket, bevel_width=0.012, segments=1)
    assign_mat(basket, mats["steel"])
    acc_objs.append(basket)

    # Portafilter Walnut Handle extending forward-right
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=20,
        radius=0.072,
        depth=0.56,
        location=(0.32, -0.52, -0.24),
        rotation=(math.radians(90), 0, math.radians(-38)),
    )
    pf_handle = bpy.context.active_object
    polish_mesh(pf_handle, bevel_width=0.018, segments=2)
    assign_mat(pf_handle, mats["walnut"])
    acc_objs.append(pf_handle)

    # Side Pressure Gauge
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=24,
        radius=0.17,
        depth=0.09,
        location=(-0.44, -0.02, 0.34),
        rotation=(math.radians(90), 0, math.radians(18)),
    )
    gauge = bpy.context.active_object
    polish_mesh(gauge, bevel_width=0.01, segments=1)
    assign_mat(gauge, mats["brass"])
    acc_objs.append(gauge)

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=24,
        radius=0.135,
        depth=0.095,
        location=(-0.445, -0.03, 0.34),
        rotation=(math.radians(90), 0, math.radians(18)),
    )
    dial = bpy.context.active_object
    assign_mat(dial, mats["porcelain"])
    acc_objs.append(dial)

    # Terracotta gauge needle
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(-0.45, -0.08, 0.36),
        rotation=(0, math.radians(32), math.radians(18)),
    )
    needle = bpy.context.active_object
    needle.scale = (0.018, 0.012, 0.09)
    bpy.ops.object.transform_apply(scale=True)
    assign_mat(needle, mats["terracotta"])
    acc_objs.append(needle)

    # Steam wand on left
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=14,
        radius=0.026,
        depth=0.64,
        location=(-0.46, -0.18, -0.24),
        rotation=(math.radians(12), math.radians(-14), 0),
    )
    wand = bpy.context.active_object
    assign_mat(wand, mats["steel"])
    acc_objs.append(wand)

    join_into(acc_objs, "part_04_accent")

    # 5. part_05_vessel: Porcelain Espresso Cup + Golden Espresso Crema on Drip Tray
    cup_objs = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=0.22, depth=0.34, location=(0, -0.26, -0.64))
    cup = bpy.context.active_object
    polish_mesh(cup, bevel_width=0.02, segments=2)
    assign_mat(cup, mats["porcelain"])
    cup_objs.append(cup)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.09,
        minor_radius=0.024,
        major_segments=20,
        minor_segments=10,
        location=(0.23, -0.26, -0.63),
        rotation=(math.radians(90), 0, 0),
    )
    ear = bpy.context.active_object
    assign_mat(ear, mats["porcelain"])
    cup_objs.append(ear)

    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.19, depth=0.04, location=(0, -0.26, -0.48))
    crema = bpy.context.active_object
    assign_mat(crema, mats["crema"])
    cup_objs.append(crema)

    join_into(cup_objs, "part_05_vessel")
    export_glb("kobo-lever-espresso.glb")


def build_pourover_set():
    """
    Asset 02: KOBO Fluted Ceramic V60 Pour-Over, Borosilicate Carafe & Rose-Copper Kettle.
    """
    reset_scene()
    mats = create_palette()

    # 1. part_01_base: Conical Borosilicate Carafe + Amber Brewed Coffee + Glass Handle
    srv_objs = []
    bpy.ops.mesh.primitive_cone_add(
        vertices=32,
        radius1=0.52,
        radius2=0.34,
        depth=0.82,
        location=(-0.38, 0, -0.52),
    )
    carafe = bpy.context.active_object
    polish_mesh(carafe, bevel_width=0.025, segments=2)
    assign_mat(carafe, mats["glass"])
    srv_objs.append(carafe)

    # Glowing Amber Filter Coffee inside server
    bpy.ops.mesh.primitive_cone_add(
        vertices=28,
        radius1=0.47,
        radius2=0.39,
        depth=0.46,
        location=(-0.38, 0, -0.66),
    )
    coffee_liq = bpy.context.active_object
    polish_mesh(coffee_liq, bevel_width=0.015, segments=1)
    assign_mat(coffee_liq, mats["amber_coffee"])
    srv_objs.append(coffee_liq)

    # Brass volume calibration ring on server
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.44,
        minor_radius=0.012,
        major_segments=32,
        minor_segments=8,
        location=(-0.38, 0, -0.48),
    )
    v_ring = bpy.context.active_object
    assign_mat(v_ring, mats["brass"])
    srv_objs.append(v_ring)

    # Carafe Side Handle
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.22,
        minor_radius=0.032,
        major_segments=24,
        minor_segments=10,
        location=(-0.82, 0, -0.52),
        rotation=(math.radians(90), 0, 0),
    )
    c_handle = bpy.context.active_object
    assign_mat(c_handle, mats["glass"])
    srv_objs.append(c_handle)

    join_into(srv_objs, "part_01_base")

    # 2. part_02_body: Turned Walnut Collar Ring
    col_objs = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.42, depth=0.11, location=(-0.38, 0, -0.06))
    collar = bpy.context.active_object
    polish_mesh(collar, bevel_width=0.018, segments=2)
    assign_mat(collar, mats["walnut"])
    col_objs.append(collar)

    join_into(col_objs, "part_02_body")

    # 3. part_03_top: Spiral-Fluted Matte White Porcelain V60 Dripper
    v60_objs = []
    bpy.ops.mesh.primitive_cone_add(
        vertices=32,
        radius1=0.20,
        radius2=0.56,
        depth=0.68,
        location=(-0.38, 0, 0.34),
    )
    cone = bpy.context.active_object
    polish_mesh(cone, bevel_width=0.015, segments=1)
    assign_mat(cone, mats["porcelain"])
    v60_objs.append(cone)

    # 16 Fluted Spiral Ribs around the V60 cone
    for i in range(16):
        ang = math.radians(i * (360.0 / 16.0))
        rx = -0.38 + math.cos(ang) * 0.38
        ry = math.sin(ang) * 0.38
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=8,
            radius=0.022,
            depth=0.64,
            location=(rx, ry, 0.34),
            rotation=(math.sin(ang) * 0.28, -math.cos(ang) * 0.28, ang + 0.35),
        )
        rib = bpy.context.active_object
        assign_mat(rib, mats["porcelain"])
        v60_objs.append(rib)

    # Coffee grounds bloom disk inside V60
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.42, depth=0.06, location=(-0.38, 0, 0.52))
    bloom = bpy.context.active_object
    assign_mat(bloom, mats["roast_bean"])
    v60_objs.append(bloom)

    join_into(v60_objs, "part_03_top")

    # 4. part_04_accent: Rose-Copper Gooseneck Pouring Kettle Body + Spout + Walnut Handle
    kettle_objs = []
    bpy.ops.mesh.primitive_cone_add(
        vertices=32,
        radius1=0.44,
        radius2=0.28,
        depth=0.88,
        location=(0.54, 0, -0.46),
    )
    k_body = bpy.context.active_object
    polish_mesh(k_body, bevel_width=0.022, segments=2)
    assign_mat(k_body, mats["copper"])
    kettle_objs.append(k_body)

    # Gooseneck Spout segments arcing toward the V60
    spout_pts = [
        (0.20, 0, -0.62, 0.35),
        (0.08, 0, -0.32, 0.12),
        (0.02, 0, 0.02, -0.18),
        (-0.08, 0, 0.28, -0.52),
    ]
    for sx, sy, sz, rot_y in spout_pts:
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=14,
            radius=0.032,
            depth=0.36,
            location=(sx, sy, sz),
            rotation=(0, rot_y, 0),
        )
        sp = bpy.context.active_object
        assign_mat(sp, mats["copper"])
        kettle_objs.append(sp)

    # Kettle Angled Walnut Handle
    bpy.ops.mesh.primitive_cube_add(
        size=1.0,
        location=(0.98, 0, -0.42),
        rotation=(0, math.radians(-16), 0),
    )
    k_handle = bpy.context.active_object
    k_handle.scale = (0.07, 0.09, 0.58)
    bpy.ops.object.transform_apply(scale=True)
    polish_mesh(k_handle, bevel_width=0.015, segments=1)
    assign_mat(k_handle, mats["walnut"])
    kettle_objs.append(k_handle)

    join_into(kettle_objs, "part_04_accent")

    # 5. part_05_vessel: Kettle Copper Lid & Turned Walnut Finial Knob
    lid_objs = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=0.27, depth=0.05, location=(0.54, 0, 0.01))
    lid = bpy.context.active_object
    polish_mesh(lid, bevel_width=0.01, segments=1)
    assign_mat(lid, mats["copper"])
    lid_objs.append(lid)

    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.075, depth=0.14, location=(0.54, 0, 0.10))
    knob = bpy.context.active_object
    polish_mesh(knob, bevel_width=0.015, segments=2)
    assign_mat(knob, mats["walnut"])
    lid_objs.append(knob)

    join_into(lid_objs, "part_05_vessel")
    export_glb("kobo-pourover-set.glb")


def build_stoneware_cup():
    """
    Asset 03: KOBO Speckled Stoneware Cappuccino Cup & Rosetta Latte Art on Walnut Saucer.
    """
    reset_scene()
    mats = create_palette()

    # 1. part_01_base: Turned Walnut Saucer with Recessed Rim
    saucer_objs = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=36, radius=0.98, depth=0.14, location=(0, 0, -0.56))
    saucer = bpy.context.active_object
    polish_mesh(saucer, bevel_width=0.035, segments=2)
    assign_mat(saucer, mats["walnut"])
    saucer_objs.append(saucer)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.92,
        minor_radius=0.055,
        major_segments=36,
        minor_segments=12,
        location=(0, 0, -0.49),
    )
    rim = bpy.context.active_object
    assign_mat(rim, mats["walnut"])
    saucer_objs.append(rim)

    join_into(saucer_objs, "part_01_base")

    # 2. part_02_body: Speckled Stoneware Cappuccino Bowl & Foot Ring
    cup_objs = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=36, radius=0.68, depth=0.72, location=(0, 0, -0.08))
    bowl = bpy.context.active_object
    polish_mesh(bowl, bevel_width=0.08, segments=3)
    assign_mat(bowl, mats["stoneware"])
    cup_objs.append(bowl)

    # Terracotta unglazed basal foot ring
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.58,
        minor_radius=0.04,
        major_segments=32,
        minor_segments=10,
        location=(0, 0, -0.43),
    )
    foot = bpy.context.active_object
    assign_mat(foot, mats["terracotta"])
    cup_objs.append(foot)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.65,
        minor_radius=0.036,
        major_segments=36,
        minor_segments=12,
        location=(0, 0, 0.28),
    )
    lip = bpy.context.active_object
    assign_mat(lip, mats["stoneware"])
    cup_objs.append(lip)

    join_into(cup_objs, "part_02_body")

    # 3. part_03_top: Sculpted Stoneware Ear Handle + Brass Tasting Spoon on Saucer
    handle_objs = []
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.24,
        minor_radius=0.062,
        major_segments=28,
        minor_segments=12,
        location=(0.74, 0, -0.04),
        rotation=(math.radians(90), 0, 0),
    )
    ear = bpy.context.active_object
    assign_mat(ear, mats["stoneware"])
    handle_objs.append(ear)

    join_into(handle_objs, "part_03_top")

    # 4. part_04_accent: Golden Espresso Crema Surface
    crema_objs = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=36, radius=0.62, depth=0.06, location=(0, 0, 0.25))
    crema = bpy.context.active_object
    polish_mesh(crema, bevel_width=0.015, segments=1)
    assign_mat(crema, mats["crema"])
    crema_objs.append(crema)

    join_into(crema_objs, "part_04_accent")

    # 5. part_05_vessel: 3D Sculpted Rosetta Microfoam Latte Art
    foam_objs = []
    leaf_offsets = [
        (-0.28, 0.22, 28),
        (-0.14, 0.30, 24),
        (0.00, 0.34, 20),
        (0.14, 0.26, 16),
    ]
    for ly, span, ang in leaf_offsets:
        for side in (-1, 1):
            bpy.ops.mesh.primitive_uv_sphere_add(
                segments=16,
                ring_count=10,
                radius=0.14,
                location=(side * span * 0.55, ly, 0.29),
            )
            petal = bpy.context.active_object
            petal.scale = (1.35, 0.52, 0.22)
            petal.rotation_euler = (0, 0, math.radians(side * ang))
            bpy.ops.object.transform_apply(scale=True, rotation=True)
            assign_mat(petal, mats["porcelain"])
            foam_objs.append(petal)

    # Top heart crown & central stem
    bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=12, radius=0.16, location=(0, 0.28, 0.295))
    heart = bpy.context.active_object
    heart.scale = (1.1, 0.95, 0.24)
    bpy.ops.object.transform_apply(scale=True)
    assign_mat(heart, mats["porcelain"])
    foam_objs.append(heart)

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=12,
        radius=0.025,
        depth=0.68,
        location=(0, 0.0, 0.295),
        rotation=(math.radians(90), 0, 0),
    )
    stem = bpy.context.active_object
    assign_mat(stem, mats["porcelain"])
    foam_objs.append(stem)

    join_into(foam_objs, "part_05_vessel")
    export_glb("kobo-stoneware-cup.glb")


def build_coffee_pouch():
    """
    Asset 04: KOBO Embossed White-Kraft Specialty Coffee Pouch with Brass Valve & Floating Beans.
    Uses rich warm toasted kraft, espresso plaque border, terracotta origin seal, and grooved beans
    so the silhouette has high contrast against the sunlit alabaster canvas.
    """
    reset_scene()
    mats = create_palette()

    # 1. part_01_base: Stand-up Warm Kraft Pouch + Deep Walnut-Kraft Side Gussets
    bag_objs = []
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.08))
    pouch = bpy.context.active_object
    pouch.scale = (0.96, 0.42, 1.44)
    bpy.ops.object.transform_apply(scale=True)
    polish_mesh(pouch, bevel_width=0.045, segments=2)
    assign_mat(pouch, mats["white_kraft"])
    bag_objs.append(pouch)

    for side in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side * 0.47, 0, -0.08))
        gusset = bpy.context.active_object
        gusset.scale = (0.06, 0.38, 1.38)
        bpy.ops.object.transform_apply(scale=True)
        polish_mesh(gusset, bevel_width=0.015, segments=1)
        assign_mat(gusset, mats["walnut"])
        bag_objs.append(gusset)

    join_into(bag_objs, "part_01_base")

    # 2. part_02_body: Framed Architectural Origin Label + Topographic Ridge Relief + Terracotta Seal
    emb_objs = []
    # Recessed dark espresso label frame on front face (-Y)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.212, -0.14))
    label_frame = bpy.context.active_object
    label_frame.scale = (0.72, 0.018, 0.88)
    bpy.ops.object.transform_apply(scale=True)
    polish_mesh(label_frame, bevel_width=0.008, segments=1)
    assign_mat(label_frame, mats["obsidian"])
    emb_objs.append(label_frame)

    # Cream porcelain inner label card
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.218, -0.12))
    label_card = bpy.context.active_object
    label_card.scale = (0.66, 0.018, 0.78)
    bpy.ops.object.transform_apply(scale=True)
    assign_mat(label_card, mats["porcelain"])
    emb_objs.append(label_card)

    # Sculpted topographic mountain peaks in warm natural kraft & terracotta
    peaks = [
        (-0.16, -0.228, -0.18, 0.22, 0.34, "natural_kraft"),
        (0.04, -0.232, -0.12, 0.28, 0.44, "terracotta"),
        (0.18, -0.228, -0.20, 0.20, 0.30, "natural_kraft"),
    ]
    for px, py, pz, r_w, r_h, m_key in peaks:
        bpy.ops.mesh.primitive_cone_add(
            vertices=4,
            radius1=r_w,
            radius2=0.01,
            depth=r_h,
            location=(px, py, pz),
            rotation=(0, 0, math.radians(45)),
        )
        pk = bpy.context.active_object
        pk.scale = (1.0, 0.14, 1.0)
        bpy.ops.object.transform_apply(scale=True)
        polish_mesh(pk, bevel_width=0.008, segments=1)
        assign_mat(pk, mats[m_key])
        emb_objs.append(pk)

    # Terracotta Origin Stamp Bar at base of label
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.226, -0.44))
    stamp = bpy.context.active_object
    stamp.scale = (0.66, 0.02, 0.12)
    bpy.ops.object.transform_apply(scale=True)
    assign_mat(stamp, mats["terracotta"])
    emb_objs.append(stamp)

    join_into(emb_objs, "part_02_body")

    # 3. part_03_top: Heat-Sealed Crimp Header & Brass Zipper Strip
    top_objs = []
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.72))
    crimp = bpy.context.active_object
    crimp.scale = (1.00, 0.12, 0.22)
    bpy.ops.object.transform_apply(scale=True)
    polish_mesh(crimp, bevel_width=0.018, segments=2)
    assign_mat(crimp, mats["natural_kraft"])
    top_objs.append(crimp)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.07, 0.62))
    zipper = bpy.context.active_object
    zipper.scale = (0.96, 0.025, 0.035)
    bpy.ops.object.transform_apply(scale=True)
    assign_mat(zipper, mats["brass"])
    top_objs.append(zipper)

    join_into(top_objs, "part_03_top")

    # 4. part_04_accent: Brushed Brass One-Way Aroma Degassing Valve
    val_objs = []
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=28,
        radius=0.11,
        depth=0.04,
        location=(0, -0.225, 0.42),
        rotation=(math.radians(90), 0, 0),
    )
    valve = bpy.context.active_object
    polish_mesh(valve, bevel_width=0.008, segments=1)
    assign_mat(valve, mats["brass"])
    val_objs.append(valve)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.075,
        minor_radius=0.014,
        major_segments=24,
        minor_segments=8,
        location=(0, -0.245, 0.42),
        rotation=(math.radians(90), 0, 0),
    )
    v_ring = bpy.context.active_object
    assign_mat(v_ring, mats["brass"])
    val_objs.append(v_ring)

    join_into(val_objs, "part_04_accent")

    # 5. part_05_vessel: Floating Roasted Arabica Coffee Beans
    bean_objs = []
    bean_coords = [
        (-0.74, -0.18, 0.56, (25, 40, -15)),
        (-0.82, 0.12, 0.18, (-35, 18, 50)),
        (-0.68, -0.24, -0.28, (48, -22, 30)),
        (-0.58, 0.18, -0.64, (-18, 55, -40)),
        (0.72, -0.16, 0.48, (-28, -35, 22)),
        (0.84, 0.14, 0.08, (40, 24, -45)),
        (0.68, -0.22, -0.34, (-50, 30, 18)),
        (0.60, 0.16, -0.68, (22, -48, 35)),
    ]
    for bx, by, bz, (rx, ry, rz) in bean_coords:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=0.105, location=(bx, by, bz))
        bean = bpy.context.active_object
        bean.scale = (0.72, 1.18, 0.58)
        bean.rotation_euler = (math.radians(rx), math.radians(ry), math.radians(rz))
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        assign_mat(bean, mats["roast_bean"])
        bean_objs.append(bean)

    join_into(bean_objs, "part_05_vessel")
    export_glb("kobo-coffee-pouch.glb")


if __name__ == "__main__":
    build_lever_espresso()
    build_pourover_set()
    build_stoneware_cup()
    build_coffee_pouch()
