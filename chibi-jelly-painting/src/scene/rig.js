import { Quaternion, Vector3, MathUtils } from 'three/webgpu'

class Spring
{
    constructor( stiffness = 180, damping = 14, value = 0 )
    {
        this.k = stiffness
        this.c = damping
        this.x = value
        this.v = 0
        this.target = value
    }

    step( dt )
    {
        const steps = Math.ceil( dt / ( 1 / 240 ) )
        const h = dt / steps
        for( let i = 0; i < steps; i++ )
        {
            this.v += ( - this.k * ( this.x - this.target ) - this.c * this.v ) * h
            this.x += this.v * h
        }
        return this.x
    }
}

const GRAVITY = - 14
const LAUNCH = 4.1
const CROUCH_TIME = 0.1

const axisX = new Vector3( 1, 0, 0 )
const axisZ = new Vector3( 0, 0, 1 )
const qa = new Quaternion()
const qb = new Quaternion()
const lookLocal = new Vector3()

/** Every bit of life in the scene: bobbing, blinking, looking, jumping, jiggling. */
export function createRig( kid, nimbus, farClouds )
{
    const squash = new Spring( 260, 13 )
    const cloud = new Spring( 120, 7 )
    const cloudSquash = new Spring( 200, 9 )
    const wave = new Spring( 60, 12 )
    const air = new Spring( 90, 14 )
    const yaw = new Spring( 70, 13 )
    const pitch = new Spring( 70, 13 )
    const hairX = new Spring( 160, 7 )
    const hairY = new Spring( 160, 7 )

    const jump = { phase: 'ground', timer: 0, y: 0, vy: 0 }
    const blink = { next: 2 + Math.random() * 3, t: - 1 }
    const waveTimer = { next: 5, until: 0 }

    let lookTarget = null
    let lastYaw = 0
    let time = 0

    function startJump()
    {
        if( jump.phase !== 'ground' ) return
        jump.phase = 'crouch'
        jump.timer = CROUCH_TIME
        squash.target = - 0.2
    }

    function bounceCloud()
    {
        cloud.v -= 1.6
        cloudSquash.v -= 2.2
        if( jump.phase === 'ground' ) squash.v -= 1.6
        hairY.v += 3
    }

    function startWave( seconds = 2.2 )
    {
        waveTimer.until = time + seconds
    }

    function setLookTarget( worldPoint ) { lookTarget = worldPoint }

    function update( dt )
    {
        time += dt
        const t = time

        // jump state machine
        if( jump.phase === 'crouch' )
        {
            jump.timer -= dt
            if( jump.timer <= 0 )
            {
                jump.phase = 'air'
                jump.vy = LAUNCH
                squash.target = 0
                squash.v += 3
                cloud.v -= 1.2
                cloudSquash.v -= 1.5
                hairY.v -= 4
            }
        }
        else if( jump.phase === 'air' )
        {
            jump.vy += GRAVITY * dt
            jump.y += jump.vy * dt
            if( jump.y <= 0 )
            {
                const impact = - jump.vy
                jump.y = 0
                jump.vy = 0
                jump.phase = 'ground'
                squash.v -= impact * 0.55
                cloud.v -= impact * 0.35
                cloudSquash.v -= impact * 0.6
                hairY.v += impact * 1.1
            }
        }

        const airborne = jump.phase === 'air'
        air.target = airborne ? 1 : 0
        air.step( dt )
        squash.target = jump.phase === 'crouch' ? - 0.2 : airborne ? MathUtils.clamp( jump.vy * 0.03, - 0.08, 0.14 ) : 0
        const s = squash.step( dt )

        // floating together
        const bob = Math.sin( t * 1.3 ) * 0.07
        const cloudBob = Math.sin( t * 1.3 - 0.45 ) * 0.07
        cloud.step( dt )
        const cs = cloudSquash.step( dt )

        kid.root.position.y = bob + jump.y + cloud.x * 0.6
        kid.root.rotation.z = Math.sin( t * 0.9 ) * 0.025
        const breathe = Math.sin( t * 2.4 ) * 0.012
        kid.body.scale.set( 1 - s * 0.5 - breathe * 0.4, 1 + s + breathe, 1 - s * 0.5 - breathe * 0.4 )

        nimbus.group.position.y = cloudBob + cloud.x
        nimbus.group.rotation.z = Math.sin( t * 0.9 - 0.3 ) * 0.04
        nimbus.group.rotation.x = Math.sin( t * 0.7 ) * 0.025
        nimbus.group.scale.set( 1 - cs * 0.4, 1 + cs, 1 - cs * 0.4 )
        nimbus.tail.rotation.y = Math.sin( t * 1.7 ) * 0.06

        for( const c of farClouds.clouds )
        {
            c.mesh.position.x = c.base.x + Math.sin( t * c.speed + c.phase ) * 0.6
            c.mesh.position.y = c.base.y + Math.sin( t * c.speed * 1.7 + c.phase ) * 0.12
        }

        // look toward the pointer
        if( lookTarget )
        {
            lookLocal.copy( lookTarget )
            kid.neck.worldToLocal( lookLocal )
            lookLocal.y -= 0.48
            yaw.target = MathUtils.clamp( Math.atan2( lookLocal.x, lookLocal.z ), - 0.75, 0.75 )
            pitch.target = MathUtils.clamp( Math.atan2( lookLocal.y, Math.hypot( lookLocal.x, lookLocal.z ) ), - 0.35, 0.45 )
        }
        yaw.step( dt )
        pitch.step( dt )
        kid.neck.rotation.y = yaw.x
        kid.head.rotation.x = - pitch.x + Math.sin( t * 1.3 + 0.8 ) * 0.02
        kid.head.rotation.z = Math.sin( t * 0.9 + 0.5 ) * 0.03 - yaw.x * 0.08

        // hair lags behind head turns and vertical motion
        const yawVelocity = ( yaw.x - lastYaw ) / Math.max( dt, 1e-4 )
        lastYaw = yaw.x
        hairX.target = MathUtils.clamp( - yawVelocity * 0.05, - 0.3, 0.3 )
        hairY.target = 0
        hairX.step( dt )
        hairY.step( dt )
        for( let i = 0; i < kid.spikes.length; i++ )
        {
            const spike = kid.spikes[ i ]
            const w = spike.weight * 0.5
            const sway = Math.sin( t * 1.9 + i * 1.3 ) * 0.015
            qa.setFromAxisAngle( axisZ, MathUtils.clamp( hairY.x * 0.06, - 0.35, 0.35 ) * w + sway )
            qb.setFromAxisAngle( axisX, hairX.x * w )
            spike.pivot.quaternion.copy( spike.rest ).multiply( qa ).multiply( qb )
        }

        // tail: a curl that swishes
        const segments = kid.tail.segments
        for( let i = 0; i < segments.length; i++ )
        {
            const seg = segments[ i ]
            const curl = i === 0 ? - 2.15 : 0.36
            seg.rotation.x = curl + Math.sin( t * 1.6 - i * 0.5 ) * 0.07 + air.x * ( i === 0 ? 0.4 : - 0.05 )
            seg.rotation.z = Math.sin( t * 2.3 - i * 0.65 ) * ( i === 0 ? 0.3 : 0.14 )
        }

        // blink
        blink.next -= dt
        if( blink.next <= 0 )
        {
            blink.t = 0
            blink.next = 1.8 + Math.random() * 3.5
            if( Math.random() < 0.2 ) blink.next = 0.22
        }
        let lid = 1
        if( blink.t >= 0 )
        {
            blink.t += dt
            const k = blink.t / 0.15
            lid = k >= 1 ? 1 : 1 - Math.sin( k * Math.PI ) * 0.92
            if( k >= 1 ) blink.t = - 1
        }
        for( const eye of kid.eyes ) eye.scale.y = lid

        // arms: relaxed, flung up in the air, or a wave every so often
        if( t > waveTimer.next && jump.phase === 'ground' && t > waveTimer.until )
        {
            startWave()
            waveTimer.next = t + 9 + Math.random() * 6
        }
        wave.target = t < waveTimer.until ? 1 : 0
        const wv = wave.step( dt )
        const a = air.x

        for( const side of [ - 1, 1 ] )
        {
            const arm = side < 0 ? kid.arms.left : kid.arms.right
            const swing = Math.sin( t * 1.3 + side ) * 0.04
            let shoulderZ = side * ( 0.32 + swing ) + side * a * 1.2
            let shoulderX = - 0.08 - a * 0.25
            let elbowX = - 0.35 - a * 0.2
            let elbowZ = 0
            if( side > 0 )
            {
                shoulderZ = MathUtils.lerp( shoulderZ, 2.55, wv )
                shoulderX = MathUtils.lerp( shoulderX, - 0.15, wv )
                elbowX = MathUtils.lerp( elbowX, - 0.1, wv )
                elbowZ = MathUtils.lerp( 0, 0.35 + Math.sin( t * 11 ) * 0.5, wv )
            }
            arm.shoulder.rotation.set( shoulderX, 0, shoulderZ )
            arm.elbow.rotation.set( elbowX, 0, elbowZ )
        }
    }

    return { update, startJump, bounceCloud, startWave, setLookTarget, get airborne() { return jump.phase !== 'ground' } }
}
