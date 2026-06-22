#include "httplib.h"
#include "json.hpp"
#include <iostream>
#include "black_scholes.hpp"
#include "implied_vol.hpp"
using json = nlohmann::json;

int main() {
    httplib::Server svr;

    svr.Get("/health", [](const httplib::Request& req, httplib::Response& res) {
        res.set_content("ok", "text/plain");
    });

    svr.Get("/price", [](const httplib::Request& req, httplib::Response& res) {
        double S     = std::stod(req.get_param_value("S"));
        double K     = std::stod(req.get_param_value("K"));
        double T     = std::stod(req.get_param_value("T"));
        double r     = std::stod(req.get_param_value("r"));
        double sigma = std::stod(req.get_param_value("sigma"));
        bool is_call = req.get_param_value("type") != "put";
        std::string model = req.has_param("model") ? req.get_param_value("model") : "black_scholes";
        std::string style = req.has_param("style") ? req.get_param_value("style") : "european";
        int steps = req.has_param("steps") ? std::stoi(req.get_param_value("steps")) : 200;
        bool amer = (style == "american");
        double price = (model == "binomial" || amer)
            ? crr_price(S, K, T, r, sigma, steps, is_call, amer)
            : bs_price(S, K, T, r, sigma, is_call);
        json j;
        j["price"]  = price;
        j["model"]  = (model == "binomial" || amer) ? "binomial_crr" : "black_scholes";
        j["source"] = "engine";
        res.set_content(j.dump(), "application/json");
    });
    svr.Get("/iv", [](const httplib::Request& req, httplib::Response& res) {
        double market = std::stod(req.get_param_value("market"));
        double S = std::stod(req.get_param_value("S"));
        double K = std::stod(req.get_param_value("K"));
        double T = std::stod(req.get_param_value("T"));
        double r = std::stod(req.get_param_value("r"));
        bool is_call = req.get_param_value("type") != "put";
        
        double iv = implied_vol(market, S, K, T, r, is_call);
        json j;
        j["implied_vol"] = iv;
        j["vega"]        = bs_vega(S, K, T, r, iv);
        res.set_content(j.dump(), "application/json");
    });
    std::cout << "engine listening on :8000\n";
    svr.listen("0.0.0.0", 8000);
}