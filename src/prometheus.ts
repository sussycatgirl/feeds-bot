import prometheus from 'prom-client';
import Surreal from 'surrealdb.js';
import Express from 'express';
import { logger } from '.';

const setupProm = (db: Surreal) => {
    const register = new prometheus.Registry();

    const metrics = {
        commands: new prometheus.Counter({ name: 'feeds_commands', help: 'Executed commands', labelNames: [ 'name' ] }),
        subscriptions: new prometheus.Gauge({
            name: 'feeds_subscriptions',
            help: 'Total amount of RSS subscriptions',
            async collect() {
                try {
                    const [res] = await db.query('SELECT count() FROM feeds GROUP BY ALL;');
                    this.set(Number((res.result as any)[0].count));
                } catch(e) {
                    console.error(e);
                    this.set(-1);
                }
            },
        }),
    }

    for (const metric of Object.values(metrics)) {
        register.registerMetric(metric);
    }

    prometheus.collectDefaultMetrics({ register, prefix: 'feeds_' });

    const port = Number(process.env.PROMETHEUS_PORT);
    if (isNaN(port)) {
        logger.info('$PROMETHEUS_PORT not set; not enabling metrics');
        return metrics;
    }

    const app = Express();

    app.get('/metrics', async (req: Express.Request, res: Express.Response) => {
        res.send(await register.metrics());
    });

    app.listen(port, () => logger.info(`Metrics available on 0.0.0.0:${port}/metrics`));

    return metrics;

}

export { setupProm }
