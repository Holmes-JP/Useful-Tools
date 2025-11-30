import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function ObsConfetti() {
    const [searchParams] = useSearchParams();
    const duration = Number(searchParams.get('duration')) || 3000;
    const count = Number(searchParams.get('count')) || 100;
    const colors = (searchParams.get('colors') || '#FFC700,#FF0000,#2E3192,#41BBC7').split(',');
    
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let particles: any[] = [];
        let animationId: number;
        const startTime = Date.now();

        // パーティクル生成
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                w: Math.random() * 10 + 5,
                h: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                vy: Math.random() * 3 + 2,
                vx: Math.random() * 2 - 1,
                rotate: Math.random() * 360,
                rotateSpeed: Math.random() * 10 - 5
            });
        }

        const render = () => {
            if (Date.now() - startTime > duration) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return; 
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(p => {
                p.y += p.vy;
                p.x += p.vx;
                p.rotate += p.rotateSpeed;
                
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotate * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();

                // 画面外に出たら上に戻す（ループ演出）
                if (p.y > canvas.height) p.y = -50;
            });

            animationId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationId);
    }, [duration, count]);

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />;
}
