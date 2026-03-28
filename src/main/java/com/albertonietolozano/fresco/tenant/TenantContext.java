package com.albertonietolozano.fresco.tenant;

// Almacén del tenantId activo para el hilo actual, usado para filtrar datos por negocio en cada petición.
public class TenantContext {

    // ThreadLocal garantiza aislamiento por hilo: cada petición concurrente ve únicamente su propio tenantId.
    private static final ThreadLocal<Long> currentTenant = new ThreadLocal<>();

    private TenantContext() {}

    public static void setTenantId(Long tenantId) {
        currentTenant.set(tenantId);
    }

    public static Long getTenantId() {
        return currentTenant.get();
    }

    public static void clear() {
        // remove() elimina la entrada del hilo para evitar memory leaks en pools de hilos reutilizados (Tomcat).
        currentTenant.remove();
    }
}
