using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;
using Stripe;

namespace Angjobs.Models
{
   
    public class StripeChargeModel
    {
        [Required]
        public string Id { get; set; } //Token
       
        public int? Amount { get; set; }
        public string Email { get; set; }

        [JsonProperty("card")]
        public StripeCreditCardOptions Card { get; set; }

        public string Client_ip { get; set; }

    }

  //  "id": "tok_15tiUhB4XPnfOT95LW4l9k33",
  //"livemode": false,
  //"created": 1429550139,
  //"used": false,
  //"object": "token",
  //"type": "card",
  //"card": {
  //  "id": "card_15tiUhB4XPnfOT95AW9D3Tjl",
  //  "object": "card",
  //  "last4": "4242",
  //  "brand": "Visa",
  //  "funding": "credit",
  //  "exp_month": 1,
  //  "exp_year": 2018,
  //  "country": "US",
  //  "name": null,
  //  "address_line1": null,
  //  "address_line2": null,
  //  "address_city": null,
  //  "address_state": null,
  //  "address_zip": null,
  //  "address_country": null,
  //  "cvc_check": "unchecked",
  //  "address_line1_check": null,
  //  "address_zip_check": null,
  //  "dynamic_last4": null
  //},
  //"client_ip": "86.130.64.86"
}