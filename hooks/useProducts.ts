"use client";

import { useState, useEffect, useCallback } from "react";
import { Product, CreateProductInput } from "@/types";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [automatingId, setAutomatingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Erro ao buscar produtos");
      const data = await res.json() as Product[];
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = useCallback(async (input: CreateProductInput): Promise<Product> => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const body = await res.json() as { error?: string };
      throw new Error(body.error ?? "Erro ao criar produto");
    }

    const newProduct = await res.json() as Product;
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  }, []);

  const launchAutomation = useCallback(async (productId: string): Promise<void> => {
    setAutomatingId(productId);
    // Otimista — marca como creating no UI
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, status: "creating" as const } : p))
    );

    try {
      const res = await fetch("/api/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        // Marca como failed no UI
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? { ...p, status: "failed" as const, error_message: body.error ?? "Erro na automação" }
              : p
          )
        );
        throw new Error(body.error ?? "Erro na automação");
      }

      const updated = await res.json() as Product;
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updated : p))
      );
    } finally {
      setAutomatingId(null);
    }
  }, []);

  const deleteProduct = useCallback(async (productId: string): Promise<void> => {
    const res = await fetch(`/api/products?id=${productId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Erro ao deletar produto");
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const stats = {
    total:    products.length,
    draft:    products.filter((p) => p.status === "draft").length,
    active:   products.filter((p) => p.status === "active").length,
    failed:   products.filter((p) => p.status === "failed").length,
    creating: products.filter((p) => p.status === "creating").length,
  };

  return {
    products,
    loading,
    error,
    automatingId,
    stats,
    createProduct,
    launchAutomation,
    deleteProduct,
    refetch: fetchProducts,
  };
}
