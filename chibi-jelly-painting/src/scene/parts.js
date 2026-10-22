import { Mesh, Vector3, Matrix4, Quaternion, Euler } from 'three/webgpu'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Small helpers shared by the scenery builders.

export const seeded = ( seed ) => () => ( seed = ( seed * 16807 ) % 2147483647 ) / 2147483647

export const smooth = ( x ) => x * x * ( 3 - 2 * x )

// yaw first, then pitch and roll in the turned frame, so props can face outward and still nod
export function trs( [ x = 0, y = 0, z = 0 ] = [], [ rx = 0, ry = 0, rz = 0 ] = [], s = 1 )
{
    const scale = Array.isArray( s ) ? new Vector3( ...s ) : new Vector3( s, s, s )
    return new Matrix4().compose( new Vector3( x, y, z ), new Quaternion().setFromEuler( new Euler( rx, ry, rz, 'YXZ' ) ), scale )
}

/** Collects transformed copies per material and merges them into one mesh each. */
export class Parts
{
    constructor() { this.lists = {} }

    add( key, geometry, matrix )
    {
        const g = geometry.clone()
        g.applyMatrix4( matrix )
        ;( this.lists[ key ] ??= [] ).push( g )
    }

    build( materials, parent )
    {
        const meshes = []
        for( const [ key, list ] of Object.entries( this.lists ) )
        {
            const m = new Mesh( mergeGeometries( list ), materials[ key ] )
            parent.add( m )
            meshes.push( m )
        }
        return meshes
    }
}
