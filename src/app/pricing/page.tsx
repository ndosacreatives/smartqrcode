"use client";

import React from "react";
import Link from "next/link";
import { CheckIcon } from "@heroicons/react/24/outline";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Basic QR code generation for personal use",
    features: [
      "Basic QR codes and barcodes",
      "Limited to 5 QR codes per day",
      "Standard formats (PNG)",
      "Basic customization options",
      "No watermarks"
    ],
    buttonText: "Get Started",
    buttonLink: "/register",
    highlighted: false
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    description: "Advanced features for small businesses",
    features: [
      "Everything in Free",
      "Unlimited QR codes and barcodes",
      "Premium formats (SVG, PDF)",
      "Advanced customization options",
      "Bulk generation (up to 100)",
      "Analytics and tracking",
      "Save and organize codes",
      "Priority support"
    ],
    buttonText: "Subscribe Now",
    buttonLink: "/register?plan=pro",
    highlighted: true
  },
  {
    name: "Business",
    price: "$24.99",
    period: "/month",
    description: "Enterprise-grade features for teams",
    features: [
      "Everything in Pro",
      "Unlimited bulk generation",
      "API access",
      "White-label QR codes",
      "Team collaboration",
      "Custom branding",
      "Advanced analytics",
      "Dedicated support",
      "Service level agreement"
    ],
    buttonText: "Contact Sales",
    buttonLink: "/contact?plan=business",
    highlighted: false
  }
];

export default function PricingPage() {
  return (
    <div className="bg-gradient-to-b from-white to-blue-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
            Pricing Plans
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Choose the perfect plan for your QR code generation needs
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg shadow-lg overflow-hidden ${
                plan.highlighted 
                  ? "transform scale-105 z-10 ring-2 ring-primary" 
                  : "bg-white"
              }`}
            >
              <div className={`px-6 py-8 ${plan.highlighted ? "bg-primary bg-opacity-5" : "bg-white"}`}>
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  {plan.highlighted && (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary text-white">
                      Popular
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-xl font-medium text-gray-500">{plan.period}</span>}
                </div>
                <p className="mt-5 text-lg text-gray-500">{plan.description}</p>
              </div>
              <div className="px-6 pt-6 pb-8 bg-white">
                <h4 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
                  What's included
                </h4>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex">
                      <CheckIcon className="flex-shrink-0 h-6 w-6 text-green-500" aria-hidden="true" />
                      <span className="ml-3 text-base text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    href={plan.buttonLink}
                    className={`w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                      plan.highlighted
                        ? "bg-primary hover:bg-blue-700"
                        : "bg-gray-800 hover:bg-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
                  >
                    {plan.buttonText}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900">Frequently Asked Questions</h2>
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900">How do subscriptions work?</h3>
                <p className="mt-2 text-gray-500">
                  Subscribe to our Pro or Business plans to unlock premium features. You'll be billed monthly, and you can cancel anytime.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Can I upgrade or downgrade my plan?</h3>
                <p className="mt-2 text-gray-500">
                  Yes, you can change your plan at any time. If you upgrade, you'll be charged the prorated difference. If you downgrade, the new rate will apply at the next billing cycle.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Do you offer refunds?</h3>
                <p className="mt-2 text-gray-500">
                  We offer a 14-day money-back guarantee for all new subscriptions. Contact our support team for assistance.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">What payment methods do you accept?</h3>
                <p className="mt-2 text-gray-500">
                  We accept all major credit cards, PayPal, and Apple Pay. For Business plans, we also offer invoice payments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 