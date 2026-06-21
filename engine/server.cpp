#include "httplib.h"
#include "json.hpp"
#include <iostream>
#include "black_scholes.hpp"
using json = nlohmann::json;

int main() {
    httplib::Server svr;

    svr.Get("/health", [](const httplib::Request& req, httplib::Response& res) {
        res.set_content("ok", "text/plain");
    });

   svr.Get("/price", [](const httplib::Request& req, httplib::Response& res) {
        double S = std::stod(req.get_param_value("S"));
        double K = std::stod(req.get_param_value("K"));
        double T = std::stod(req.get_param_value("T"));
        double r = std::stod(req.get_param_value("r"));
        double sigma = std::stod(req.get_param_value("sigma"));
        bool is_call = req.get_param_value("type") != "put";
        double price = bs_price(S, K, T, r, sigma, is_call);
        json bsPrice;
        bsPrice["price"]=price;
        bsPrice["model"]="black_scholes";
        bsPrice["source"]="engine";
        res.set_content(bsPrice.dump(), "application/json");
   });

    std::cout << "engine listening on :8000\n";
    svr.listen("0.0.0.0", 8000);
}