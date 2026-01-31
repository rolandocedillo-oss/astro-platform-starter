const isEnabled = () => Deno.env.get('ENABLE_EDGE_REWRITE') === 'true';

export default async (request, context) => {
    if (!isEnabled()) {
        return context.next();
    }
    const path = context.geo?.country?.code === 'AU' ? '/edge/australia' : '/edge/not-australia';
    return Response.redirect(new URL(path, request.url));
};

export const config = {
    path: '/edge'
};
