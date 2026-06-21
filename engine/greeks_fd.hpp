#pragma once
#include <functional>
#include "black_scholes.hpp"
using Pricer = std::function<double(double,double,double,double,double)>;

Pricer bs = [](double S,double K,double T,double r,double s){ return bs_price(S,K,T,r,s,true); };
Pricer amer = [](double S,double K,double T,double r,double s){ return crr_price(S,K,T,r,s,500,false,true); };

double fd_delta(const Pricer& V, double S,double K,double T,double r,double sigma, double h = 0.01) {
    return (V(S + h, K, T, r, sigma) - V(S - h, K, T, r, sigma)) / (2 * h);
}

double fd_gamma(const Pricer& V, double S,double K,double T,double r,double sigma, double h = 0.01) {
    return (V(S + h, K, T, r, sigma) - 2.0 * V(S, K, T, r, sigma) + V(S - h, K, T, r, sigma)) / (h * h);
}

double fd_vega (const Pricer& V, double S,double K,double T,double r,double sigma, double h = 1e-4) {
    return (V(S, K, T, r, sigma + h)- V(S, K, T, r, sigma - h)) / (2 * h);
}
double fd_theta(const Pricer& V, double S,double K,double T,double r,double sigma, double h = 1e-4) {
    return -(V(S, K, T + h, r, sigma)- V(S, K, T - h, r, sigma)) / (2 * h);
}
double fd_rho  (const Pricer& V, double S,double K,double T,double r,double sigma, double h = 1e-4) {
    return (V(S, K, T, r + h, sigma)- V(S, K, T, r - h, sigma)) / (2 * h);
}