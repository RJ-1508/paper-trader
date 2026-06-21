#pragma once
#include <cmath>
#include <numbers>

double norm_cdf(double x) {
    return std::erfc(-x * std::numbers::sqrt2 * 0.5) / 2.0;
}

double norm_pdf(double x) {
    return (std::numbers::sqrt2 * 0.5 / std::sqrt(std::numbers::pi)) * std::exp(-0.5 * x * x);
}

double bs_d1(double S, double K, double T, double r, double sigma) {
    return (std::log(S / K) + (r + (sigma * sigma) / 2.0) * T) / (sigma * std::sqrt(T));
}

double bs_d2(double S, double K, double T, double r, double sigma) {
    return bs_d1(S, K, T, r, sigma) - sigma * std::sqrt(T);
}

double bs_price(double S, double K, double T, double r, double sigma, bool is_call) {
    double d1 = bs_d1(S, K, T, r, sigma);
    double d2 = d1 - sigma * std::sqrt(T);
    if (is_call) {
        return S * norm_cdf(d1) - K * std::exp(-r * T) * norm_cdf(d2);
    } else {
        return K * std::exp(-r * T) * norm_cdf(-d2) - S * norm_cdf(-d1);
    }
}

double bs_delta(double S, double K, double T, double r, double sigma, bool is_call) {
    double n_d1 = norm_cdf(bs_d1(S, K, T, r, sigma));
    if (is_call) {
        return n_d1;
    } else {
        return n_d1 - 1;
    }
}

double bs_gamma(double S, double K, double T, double r, double sigma) {
    return norm_pdf(bs_d1(S, K, T, r, sigma)) / (S * sigma * std::sqrt(T));
}

double bs_vega(double S, double K, double T, double r, double sigma) {
    return S * norm_pdf(bs_d1(S, K, T, r, sigma)) * std::sqrt(T);
}

double bs_theta(double S, double K, double T, double r, double sigma, bool is_call) {
    if (is_call) {
        return -S * norm_pdf(bs_d1(S, K, T, r, sigma)) * sigma / (2.0 * std::sqrt(T)) - r * K * std::exp(-r * T) * norm_cdf(bs_d2(S, K, T, r, sigma));
    } else {
       return  -S * norm_pdf(bs_d1(S, K, T, r, sigma)) * sigma / (2.0 * std::sqrt(T)) + r * K * std::exp(-r * T) * norm_cdf(-bs_d2(S, K, T, r, sigma));
    }
}

double bs_rho(double S, double K, double T, double r, double sigma, bool is_call) {
    if (is_call) {
        return K * T * std::exp(-r * T) * norm_cdf(bs_d2(S, K, T, r, sigma));
    } else {
        return -K * T * std::exp(-r * T) * norm_cdf(-bs_d2(S, K, T, r, sigma));
    }
}