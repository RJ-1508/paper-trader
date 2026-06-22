#pragma once
#include <cmath>
#include "black_scholes.hpp"

double iv_newton(double market, double S, double K, double T, double r, bool is_call,
                 double guess = 0.20, double tol = 1e-6, int max_iter = 100) {
    double sigma = guess;
    for (int i = 0; i < max_iter; ++i) {
        double diff = bs_price(S, K, T, r, sigma, is_call) - market;
        if (std::abs(diff) < tol) return sigma;
        double vega = bs_vega(S, K, T, r, sigma);
        if (vega < 1e-8) break;
        sigma -= diff / vega;
        if (sigma <= 0.0) break;
    }
    return -1.0;
}

double iv_bisect(double market, double S, double K, double T, double r, bool is_call,
                 double low = 1e-6, double high = 5.0, double tol = 1e-6, int max_iter = 200) {
    for (int i = 0; i < max_iter; ++i) {
        double m    = 0.5 * (low + high);
        double diff = bs_price(S, K, T, r, m, is_call) - market;
        if (std::abs(diff) < tol || (high - low) < tol) return m;
        if (diff > 0.0) high = m;
        else            low  = m;
    }
    return 0.5 * (low + high);
}

double implied_vol(double market, double S, double K, double T, double r, bool is_call) {
    double newton_sigma = iv_newton(market, S, K, T, r, is_call);
    if (newton_sigma != -1.0) return newton_sigma;
    return iv_bisect(market, S, K, T, r, is_call);
}
