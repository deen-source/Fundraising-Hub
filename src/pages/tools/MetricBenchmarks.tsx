import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StarField } from '@/components/StarField';
import { AuthGuard } from '@/components/AuthGuard';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, Target, Users, DollarSign, Zap, ArrowRight, Award, BarChart3, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BenchmarkData {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  description: string;
  icon: any;
  recommendations: {
    below: string;
    average: string;
    good: string;
    exceptional: string;
  };
  context: string;
}

interface StageData {
  [key: string]: BenchmarkData;
}

const benchmarkData: Record<string, Record<string, StageData>> = {
  'SaaS': {
    'Seed': {
      'MRR Growth Rate (%)': {
        p25: 15, p50: 25, p75: 40, p90: 60,
        description: 'Month-over-month recurring revenue growth',
        icon: TrendingUp,
        recommendations: {
          below: 'Focus on product-market fit and customer acquisition channels',
          average: 'Optimize conversion rates and reduce friction in onboarding',
          good: 'Scale proven channels and expand into new segments',
          exceptional: 'Maintain quality while scaling, consider raising Series A'
        },
        context: 'Seed-stage SaaS companies should prioritize rapid experimentation and finding repeatable growth channels.'
      },
      'Churn Rate (%)': {
        p25: 10, p50: 7, p75: 4, p90: 2,
        description: 'Monthly customer churn percentage',
        icon: Users,
        recommendations: {
          below: 'Conduct exit interviews, improve onboarding, add customer success team',
          average: 'Implement health scoring and proactive engagement',
          good: 'Focus on expansion revenue and long-term customer value',
          exceptional: 'Build community and create network effects'
        },
        context: 'High early-stage churn often indicates product-market fit issues or onboarding problems.'
      },
      'CAC Payback (months)': {
        p25: 24, p50: 18, p75: 12, p90: 8,
        description: 'Months to recover customer acquisition cost',
        icon: DollarSign,
        recommendations: {
          below: 'Reduce CAC through better targeting or improve monetization',
          average: 'Optimize sales process and improve conversion rates',
          good: 'Invest in scaling efficient channels',
          exceptional: 'Aggressively expand marketing budget'
        },
        context: 'Longer payback periods are acceptable at seed stage if LTV is strong and growth is prioritized.'
      },
      'LTV/CAC Ratio': {
        p25: 1.5, p50: 2.5, p75: 4, p90: 6,
        description: 'Lifetime value to customer acquisition cost ratio',
        icon: Target,
        recommendations: {
          below: 'Critical: Improve retention or reduce acquisition costs immediately',
          average: 'Unit economics are viable, focus on scaling',
          good: 'Strong unit economics, ready to invest in growth',
          exceptional: 'Exceptional efficiency, maximize growth investments'
        },
        context: 'A ratio below 3 may indicate challenges, while above 5 suggests room for aggressive growth.'
      },
      'Gross Margin (%)': {
        p25: 55, p50: 65, p75: 75, p90: 85,
        description: 'Revenue minus cost of goods sold',
        icon: BarChart3,
        recommendations: {
          below: 'Analyze infrastructure costs, consider pricing increases',
          average: 'Look for automation opportunities to improve margins',
          good: 'Well-positioned for profitability as you scale',
          exceptional: 'Best-in-class margins, strong competitive advantage'
        },
        context: 'SaaS companies should aim for 70%+ gross margins for VC attractiveness.'
      },
      'NDR (%)': {
        p25: 95, p50: 105, p75: 120, p90: 140,
        description: 'Net Dollar Retention including expansion',
        icon: Zap,
        recommendations: {
          below: 'Focus on reducing churn before expansion',
          average: 'Build systematic expansion motion',
          good: 'Strong retention, continue expansion efforts',
          exceptional: 'Best-in-class retention with strong expansion'
        },
        context: 'NDR above 100% means existing customers are growing, a key SaaS metric.'
      }
    },
    'Series A': {
      'MRR Growth Rate (%)': {
        p25: 10, p50: 15, p75: 25, p90: 40,
        description: 'Month-over-month recurring revenue growth',
        icon: TrendingUp,
        recommendations: {
          below: 'Revisit GTM strategy and product-market fit',
          average: 'Optimize your proven channels',
          good: 'Scale your team and channels strategically',
          exceptional: 'Prepare for Series B with this momentum'
        },
        context: 'Series A companies should have proven channels and repeatable sales processes.'
      },
      'Churn Rate (%)': {
        p25: 8, p50: 5, p75: 3, p90: 2,
        description: 'Monthly customer churn percentage',
        icon: Users,
        recommendations: {
          below: 'Invest heavily in customer success',
          average: 'Implement predictive churn models',
          good: 'Build expansion playbooks',
          exceptional: 'You have a moat, focus on product innovation'
        },
        context: 'Series A churn should be lower than seed as product-market fit improves.'
      },
      'CAC Payback (months)': {
        p25: 18, p50: 12, p75: 8, p90: 5,
        description: 'Months to recover customer acquisition cost',
        icon: DollarSign,
        recommendations: {
          below: 'Improve sales efficiency and pricing',
          average: 'Standard for Series A, focus on optimization',
          good: 'Efficient unit economics, ready to scale',
          exceptional: 'Best-in-class efficiency'
        },
        context: 'Series A investors expect <18 month payback periods.'
      },
      'LTV/CAC Ratio': {
        p25: 2, p50: 3, p75: 4, p90: 5,
        description: 'Lifetime value to customer acquisition cost ratio',
        icon: Target,
        recommendations: {
          below: 'Address unit economics before scaling',
          average: 'Viable but not exceptional',
          good: 'Strong unit economics',
          exceptional: 'Ideal ratio for aggressive scaling'
        },
        context: '3:1 is the standard benchmark for SaaS companies.'
      },
      'Gross Margin (%)': {
        p25: 60, p50: 70, p75: 80, p90: 85,
        description: 'Revenue minus cost of goods sold',
        icon: BarChart3,
        recommendations: {
          below: 'Infrastructure costs too high, needs attention',
          average: 'Acceptable but room for improvement',
          good: 'Strong margins for your stage',
          exceptional: 'Excellent margins, highly efficient'
        },
        context: 'Aim for 75%+ at Series A stage.'
      },
      'NDR (%)': {
        p25: 100, p50: 110, p75: 125, p90: 150,
        description: 'Net Dollar Retention including expansion',
        icon: Zap,
        recommendations: {
          below: 'Prioritize retention immediately',
          average: 'Build expansion revenue streams',
          good: 'Strong performance',
          exceptional: 'World-class retention and expansion'
        },
        context: '110%+ NDR is a strong signal for Series B investors.'
      }
    },
    'Series B+': {
      'MRR Growth Rate (%)': {
        p25: 8, p50: 12, p75: 20, p90: 30,
        description: 'Month-over-month recurring revenue growth',
        icon: TrendingUp,
        recommendations: {
          below: 'Growth is slowing, find new channels',
          average: 'Steady growth, maintain momentum',
          good: 'Strong growth at scale',
          exceptional: 'Rare at this scale'
        },
        context: 'Growth rates naturally decline at scale but should remain healthy.'
      },
      'Churn Rate (%)': {
        p25: 6, p50: 4, p75: 2, p90: 1,
        description: 'Monthly customer churn percentage',
        icon: Users,
        recommendations: {
          below: 'Critical issue at this stage',
          average: 'Expected for your scale',
          good: 'Strong retention',
          exceptional: 'Best-in-class retention'
        },
        context: 'Later stage companies should have <3% monthly churn.'
      },
      'CAC Payback (months)': {
        p25: 15, p50: 10, p75: 7, p90: 4,
        description: 'Months to recover customer acquisition cost',
        icon: DollarSign,
        recommendations: {
          below: 'Need to improve sales efficiency',
          average: 'Reasonable for your scale',
          good: 'Efficient GTM motion',
          exceptional: 'Exceptional efficiency'
        },
        context: 'Should be <12 months at this stage.'
      },
      'LTV/CAC Ratio': {
        p25: 2.5, p50: 3.5, p75: 5, p90: 7,
        description: 'Lifetime value to customer acquisition cost ratio',
        icon: Target,
        recommendations: {
          below: 'Focus on improving economics',
          average: 'Healthy unit economics',
          good: 'Strong economics',
          exceptional: 'Outstanding efficiency'
        },
        context: 'Later stage companies should have 3.5:1 or better.'
      },
      'Gross Margin (%)': {
        p25: 65, p50: 75, p75: 82, p90: 88,
        description: 'Revenue minus cost of goods sold',
        icon: BarChart3,
        recommendations: {
          below: 'Margins should improve with scale',
          average: 'Good margins',
          good: 'Strong operational efficiency',
          exceptional: 'World-class margins'
        },
        context: 'Should be 75%+ at scale.'
      },
      'NDR (%)': {
        p25: 105, p50: 115, p75: 130, p90: 160,
        description: 'Net Dollar Retention including expansion',
        icon: Zap,
        recommendations: {
          below: 'Expansion motion needs work',
          average: 'Solid retention',
          good: 'Excellent retention and expansion',
          exceptional: 'Among the best in SaaS'
        },
        context: '115%+ is considered strong at scale.'
      }
    }
  },
  'Marketplace': {
    'Seed': {
      'GMV Growth Rate (%)': {
        p25: 20, p50: 35, p75: 55, p90: 80,
        description: 'Month-over-month gross merchandise value growth',
        icon: TrendingUp,
        recommendations: {
          below: 'Focus on supply and demand balance',
          average: 'Scale marketing on both sides',
          good: 'Maintain growth quality',
          exceptional: 'Prepare for rapid scaling'
        },
        context: 'Marketplaces should grow faster than SaaS early on.'
      },
      'Take Rate (%)': {
        p25: 8, p50: 12, p75: 18, p90: 25,
        description: 'Revenue as percentage of GMV',
        icon: DollarSign,
        recommendations: {
          below: 'Consider value-added services',
          average: 'Optimize pricing tiers',
          good: 'Strong monetization',
          exceptional: 'Best-in-class take rate'
        },
        context: 'Take rates vary widely by marketplace vertical.'
      },
      'Repeat Purchase Rate (%)': {
        p25: 15, p50: 25, p75: 40, p90: 60,
        description: 'Percentage of buyers who return',
        icon: Users,
        recommendations: {
          below: 'Improve buyer experience',
          average: 'Build retention features',
          good: 'Strong network effects',
          exceptional: 'Sticky marketplace'
        },
        context: 'Repeat purchases indicate product-market fit.'
      },
      'Supplier Retention (%)': {
        p25: 50, p50: 65, p75: 80, p90: 90,
        description: 'Percentage of active suppliers retained',
        icon: Target,
        recommendations: {
          below: 'Critical supply-side issue',
          average: 'Improve supplier tools',
          good: 'Healthy supply',
          exceptional: 'Strong supplier loyalty'
        },
        context: 'Supply retention is often more important than demand.'
      },
      'Buyer-to-Supplier Ratio': {
        p25: 3, p50: 5, p75: 8, p90: 12,
        description: 'Ratio of active buyers to suppliers',
        icon: BarChart3,
        recommendations: {
          below: 'Too much supply, focus on demand',
          average: 'Balanced marketplace',
          good: 'Healthy marketplace dynamics',
          exceptional: 'Strong demand density'
        },
        context: 'Optimal ratio depends on your marketplace model.'
      },
      'Conversion Rate (%)': {
        p25: 1, p50: 2, p75: 4, p90: 7,
        description: 'Percentage of visitors who transact',
        icon: Zap,
        recommendations: {
          below: 'Improve search and discovery',
          average: 'Optimize checkout flow',
          good: 'Efficient conversion',
          exceptional: 'Best-in-class conversion'
        },
        context: 'Conversion rates improve as liquidity increases.'
      }
    },
    'Series A': {
      'GMV Growth Rate (%)': {
        p25: 15, p50: 25, p75: 40, p90: 60,
        description: 'Month-over-month gross merchandise value growth',
        icon: TrendingUp,
        recommendations: {
          below: 'Revisit growth levers',
          average: 'Maintain momentum',
          good: 'Strong growth',
          exceptional: 'Exceptional marketplace growth'
        },
        context: 'Growth should remain strong but more sustainable.'
      },
      'Take Rate (%)': {
        p25: 10, p50: 15, p75: 20, p90: 25,
        description: 'Revenue as percentage of GMV',
        icon: DollarSign,
        recommendations: {
          below: 'Expand monetization',
          average: 'Healthy take rate',
          good: 'Strong monetization',
          exceptional: 'Premium take rate'
        },
        context: 'Can increase as you add more value.'
      },
      'Repeat Purchase Rate (%)': {
        p25: 20, p50: 30, p75: 45, p90: 60,
        description: 'Percentage of buyers who return',
        icon: Users,
        recommendations: {
          below: 'Focus on retention',
          average: 'Build loyalty programs',
          good: 'Strong retention',
          exceptional: 'Habit-forming marketplace'
        },
        context: 'Repeat purchases drive long-term success.'
      },
      'Supplier Retention (%)': {
        p25: 60, p50: 72, p75: 85, p90: 93,
        description: 'Percentage of active suppliers retained',
        icon: Target,
        recommendations: {
          below: 'Supplier issues need attention',
          average: 'Improve supplier experience',
          good: 'Healthy supply retention',
          exceptional: 'Exceptional supplier loyalty'
        },
        context: 'Higher retention indicates marketplace strength.'
      },
      'Buyer-to-Supplier Ratio': {
        p25: 4, p50: 6, p75: 10, p90: 15,
        description: 'Ratio of active buyers to suppliers',
        icon: BarChart3,
        recommendations: {
          below: 'Balance supply and demand',
          average: 'Good marketplace balance',
          good: 'Strong liquidity',
          exceptional: 'Excellent marketplace density'
        },
        context: 'Higher ratios often indicate stronger marketplace.'
      },
      'Conversion Rate (%)': {
        p25: 1.5, p50: 2.5, p75: 4.5, p90: 8,
        description: 'Percentage of visitors who transact',
        icon: Zap,
        recommendations: {
          below: 'Improve marketplace experience',
          average: 'Optimize for conversion',
          good: 'Efficient marketplace',
          exceptional: 'Premium conversion'
        },
        context: 'Conversion improves with better inventory and trust.'
      }
    },
    'Series B+': {
      'GMV Growth Rate (%)': {
        p25: 10, p50: 18, p75: 30, p90: 50,
        description: 'Month-over-month gross merchandise value growth',
        icon: TrendingUp,
        recommendations: {
          below: 'Explore new categories',
          average: 'Solid at-scale growth',
          good: 'Strong growth at scale',
          exceptional: 'Rare at this scale'
        },
        context: 'Maintaining growth at scale is challenging.'
      },
      'Take Rate (%)': {
        p25: 12, p50: 17, p75: 23, p90: 30,
        description: 'Revenue as percentage of GMV',
        icon: DollarSign,
        recommendations: {
          below: 'Add value-added services',
          average: 'Standard take rate',
          good: 'Strong monetization',
          exceptional: 'Premium monetization'
        },
        context: 'Can increase with additional services.'
      },
      'Repeat Purchase Rate (%)': {
        p25: 25, p50: 35, p75: 50, p90: 68,
        description: 'Percentage of buyers who return',
        icon: Users,
        recommendations: {
          below: 'Retention needs focus',
          average: 'Healthy retention',
          good: 'Strong loyal customer base',
          exceptional: 'Exceptional retention'
        },
        context: 'Critical for long-term sustainability.'
      },
      'Supplier Retention (%)': {
        p25: 68, p50: 78, p75: 88, p90: 95,
        description: 'Percentage of active suppliers retained',
        icon: Target,
        recommendations: {
          below: 'Address supplier concerns',
          average: 'Good supply retention',
          good: 'Strong supplier base',
          exceptional: 'Best-in-class retention'
        },
        context: 'High retention indicates marketplace moat.'
      },
      'Buyer-to-Supplier Ratio': {
        p25: 5, p50: 8, p75: 12, p90: 18,
        description: 'Ratio of active buyers to suppliers',
        icon: BarChart3,
        recommendations: {
          below: 'Improve demand generation',
          average: 'Balanced marketplace',
          good: 'Strong liquidity',
          exceptional: 'Exceptional marketplace density'
        },
        context: 'Density creates competitive advantage.'
      },
      'Conversion Rate (%)': {
        p25: 2, p50: 3, p75: 5, p90: 9,
        description: 'Percentage of visitors who transact',
        icon: Zap,
        recommendations: {
          below: 'Optimize user experience',
          average: 'Good conversion',
          good: 'Strong conversion',
          exceptional: 'World-class conversion'
        },
        context: 'Conversion at scale indicates strong product.'
      }
    }
  },
  'E-commerce': {
    'Seed': {
      'Revenue Growth Rate (%)': {
        p25: 25, p50: 40, p75: 65, p90: 100,
        description: 'Month-over-month revenue growth',
        icon: TrendingUp,
        recommendations: {
          below: 'Test new acquisition channels',
          average: 'Scale proven channels',
          good: 'Maintain growth quality',
          exceptional: 'Prepare for rapid scaling'
        },
        context: 'Early e-commerce can grow very quickly.'
      },
      'Gross Margin (%)': {
        p25: 20, p50: 30, p75: 42, p90: 55,
        description: 'Revenue minus cost of goods sold',
        icon: BarChart3,
        recommendations: {
          below: 'Negotiate supplier terms',
          average: 'Look for margin improvements',
          good: 'Healthy margins',
          exceptional: 'Strong unit economics'
        },
        context: 'Margins vary greatly by product category.'
      },
      'AOV ($)': {
        p25: 40, p50: 65, p75: 105, p90: 180,
        description: 'Average order value',
        icon: DollarSign,
        recommendations: {
          below: 'Add bundles and upsells',
          average: 'Test premium products',
          good: 'Strong AOV',
          exceptional: 'Premium positioning'
        },
        context: 'Higher AOV improves unit economics significantly.'
      },
      'CAC Payback (months)': {
        p25: 15, p50: 10, p75: 6, p90: 3,
        description: 'Months to recover customer acquisition cost',
        icon: Target,
        recommendations: {
          below: 'Improve LTV or reduce CAC',
          average: 'Optimize for efficiency',
          good: 'Efficient acquisition',
          exceptional: 'Best-in-class efficiency'
        },
        context: 'Fast payback enables rapid scaling.'
      },
      'Repeat Purchase Rate (%)': {
        p25: 15, p50: 25, p75: 38, p90: 55,
        description: 'Percentage of customers who repurchase',
        icon: Users,
        recommendations: {
          below: 'Build retention programs',
          average: 'Focus on customer experience',
          good: 'Strong customer loyalty',
          exceptional: 'Exceptional retention'
        },
        context: 'Repeat purchases dramatically improve economics.'
      },
      'Conversion Rate (%)': {
        p25: 1, p50: 1.8, p75: 3, p90: 5,
        description: 'Percentage of visitors who purchase',
        icon: Zap,
        recommendations: {
          below: 'Optimize product pages and checkout',
          average: 'Test and improve continuously',
          good: 'Strong conversion',
          exceptional: 'World-class conversion'
        },
        context: 'Conversion rate is critical for profitability.'
      }
    },
    'Series A': {
      'Revenue Growth Rate (%)': {
        p25: 20, p50: 30, p75: 50, p90: 75,
        description: 'Month-over-month revenue growth',
        icon: TrendingUp,
        recommendations: {
          below: 'Find new growth channels',
          average: 'Solid growth',
          good: 'Strong growth trajectory',
          exceptional: 'Exceptional growth'
        },
        context: 'Should have repeatable growth systems.'
      },
      'Gross Margin (%)': {
        p25: 25, p50: 35, p75: 45, p90: 55,
        description: 'Revenue minus cost of goods sold',
        icon: BarChart3,
        recommendations: {
          below: 'Critical margin issue',
          average: 'Standard for e-commerce',
          good: 'Healthy margins',
          exceptional: 'Strong competitive advantage'
        },
        context: 'Should improve with scale and negotiation.'
      },
      'AOV ($)': {
        p25: 50, p50: 75, p75: 120, p90: 200,
        description: 'Average order value',
        icon: DollarSign,
        recommendations: {
          below: 'Add premium SKUs',
          average: 'Test bundling strategies',
          good: 'Strong AOV',
          exceptional: 'Premium brand positioning'
        },
        context: 'Higher AOV supports profitable growth.'
      },
      'CAC Payback (months)': {
        p25: 12, p50: 8, p75: 5, p90: 3,
        description: 'Months to recover customer acquisition cost',
        icon: Target,
        recommendations: {
          below: 'Improve retention or reduce CAC',
          average: 'Acceptable payback',
          good: 'Efficient economics',
          exceptional: 'Outstanding efficiency'
        },
        context: 'Should be under 12 months.'
      },
      'Repeat Purchase Rate (%)': {
        p25: 20, p50: 30, p75: 43, p90: 60,
        description: 'Percentage of customers who repurchase',
        icon: Users,
        recommendations: {
          below: 'Strengthen retention',
          average: 'Build loyalty programs',
          good: 'Strong repeat business',
          exceptional: 'Exceptional customer loyalty'
        },
        context: 'Key driver of LTV.'
      },
      'Conversion Rate (%)': {
        p25: 1.2, p50: 2, p75: 3.2, p90: 5.5,
        description: 'Percentage of visitors who purchase',
        icon: Zap,
        recommendations: {
          below: 'Major optimization needed',
          average: 'Continue optimizing',
          good: 'Strong conversion',
          exceptional: 'Best-in-class'
        },
        context: 'Directly impacts growth efficiency.'
      }
    },
    'Series B+': {
      'Revenue Growth Rate (%)': {
        p25: 15, p50: 23, p75: 38, p90: 60,
        description: 'Month-over-month revenue growth',
        icon: TrendingUp,
        recommendations: {
          below: 'Expand product lines or markets',
          average: 'Healthy at-scale growth',
          good: 'Strong growth at scale',
          exceptional: 'Exceptional at this scale'
        },
        context: 'Maintaining growth at scale is challenging.'
      },
      'Gross Margin (%)': {
        p25: 28, p50: 38, p75: 48, p90: 58,
        description: 'Revenue minus cost of goods sold',
        icon: BarChart3,
        recommendations: {
          below: 'Renegotiate supplier terms',
          average: 'Healthy margins',
          good: 'Strong margins',
          exceptional: 'Best-in-class margins'
        },
        context: 'Scale should improve margins.'
      },
      'AOV ($)': {
        p25: 60, p50: 85, p75: 135, p90: 220,
        description: 'Average order value',
        icon: DollarSign,
        recommendations: {
          below: 'Expand product range',
          average: 'Good AOV',
          good: 'Strong AOV',
          exceptional: 'Premium AOV'
        },
        context: 'Should increase with product maturity.'
      },
      'CAC Payback (months)': {
        p25: 10, p50: 7, p75: 4, p90: 2,
        description: 'Months to recover customer acquisition cost',
        icon: Target,
        recommendations: {
          below: 'Improve efficiency',
          average: 'Good payback period',
          good: 'Efficient economics',
          exceptional: 'Outstanding efficiency'
        },
        context: 'Efficiency should improve at scale.'
      },
      'Repeat Purchase Rate (%)': {
        p25: 25, p50: 35, p75: 48, p90: 65,
        description: 'Percentage of customers who repurchase',
        icon: Users,
        recommendations: {
          below: 'Critical retention issue',
          average: 'Good retention',
          good: 'Strong loyal base',
          exceptional: 'World-class retention'
        },
        context: 'Essential for sustainable growth.'
      },
      'Conversion Rate (%)': {
        p25: 1.5, p50: 2.3, p75: 3.8, p90: 6,
        description: 'Percentage of visitors who purchase',
        icon: Zap,
        recommendations: {
          below: 'Optimize aggressively',
          average: 'Good conversion',
          good: 'Strong performance',
          exceptional: 'Best-in-class'
        },
        context: 'Every 0.1% improvement is significant at scale.'
      }
    }
  },
  'FinTech': {
    'Seed': {
      'User Growth Rate (%)': {
        p25: 20, p50: 35, p75: 55, p90: 80,
        description: 'Month-over-month active user growth',
        icon: TrendingUp,
        recommendations: {
          below: 'Improve product-market fit',
          average: 'Scale acquisition channels',
          good: 'Strong viral growth',
          exceptional: 'Explosive growth'
        },
        context: 'FinTech can grow quickly with viral mechanics.'
      },
      'Transaction Volume Growth (%)': {
        p25: 25, p50: 45, p75: 70, p90: 110,
        description: 'Growth in total transaction value',
        icon: DollarSign,
        recommendations: {
          below: 'Increase user engagement',
          average: 'Drive frequency',
          good: 'Strong engagement',
          exceptional: 'Exceptional volume growth'
        },
        context: 'Should outpace user growth as engagement improves.'
      },
      'Revenue per User ($)': {
        p25: 8, p50: 18, p75: 35, p90: 65,
        description: 'Average monthly revenue per active user',
        icon: Target,
        recommendations: {
          below: 'Expand monetization',
          average: 'Add premium features',
          good: 'Healthy ARPU',
          exceptional: 'Strong monetization'
        },
        context: 'Monetization often comes after growth.'
      },
      'Retention Rate (%)': {
        p25: 50, p50: 62, p75: 75, p90: 88,
        description: 'Monthly active user retention',
        icon: Users,
        recommendations: {
          below: 'Critical engagement issue',
          average: 'Improve core product',
          good: 'Strong product engagement',
          exceptional: 'Best-in-class retention'
        },
        context: 'Financial products should be habit-forming.'
      },
      'CAC Payback (months)': {
        p25: 20, p50: 14, p75: 9, p90: 5,
        description: 'Months to recover customer acquisition cost',
        icon: BarChart3,
        recommendations: {
          below: 'Improve monetization or reduce CAC',
          average: 'Standard for fintech',
          good: 'Efficient acquisition',
          exceptional: 'Outstanding efficiency'
        },
        context: 'Often longer due to regulatory constraints.'
      },
      'Viral Coefficient': {
        p25: 0.3, p50: 0.5, p75: 0.8, p90: 1.2,
        description: 'Average invites per user that convert',
        icon: Zap,
        recommendations: {
          below: 'Build referral mechanics',
          average: 'Optimize referral program',
          good: 'Strong viral growth',
          exceptional: 'Self-sustaining virality'
        },
        context: 'Above 1.0 creates exponential growth.'
      }
    },
    'Series A': {
      'User Growth Rate (%)': {
        p25: 15, p50: 25, p75: 40, p90: 60,
        description: 'Month-over-month active user growth',
        icon: TrendingUp,
        recommendations: {
          below: 'Revisit growth strategy',
          average: 'Maintain momentum',
          good: 'Strong growth',
          exceptional: 'Exceptional growth'
        },
        context: 'Should have proven acquisition channels.'
      },
      'Transaction Volume Growth (%)': {
        p25: 20, p50: 35, p75: 55, p90: 80,
        description: 'Growth in total transaction value',
        icon: DollarSign,
        recommendations: {
          below: 'Increase transaction frequency',
          average: 'Good engagement growth',
          good: 'Strong volume growth',
          exceptional: 'Exceptional engagement'
        },
        context: 'Key indicator of product stickiness.'
      },
      'Revenue per User ($)': {
        p25: 10, p50: 25, p75: 50, p90: 100,
        description: 'Average monthly revenue per active user',
        icon: Target,
        recommendations: {
          below: 'Expand revenue streams',
          average: 'Healthy monetization',
          good: 'Strong ARPU',
          exceptional: 'Premium monetization'
        },
        context: 'Should increase as product matures.'
      },
      'Retention Rate (%)': {
        p25: 60, p50: 70, p75: 80, p90: 90,
        description: 'Monthly active user retention',
        icon: Users,
        recommendations: {
          below: 'Focus on engagement',
          average: 'Good retention',
          good: 'Strong habit formation',
          exceptional: 'Best-in-class retention'
        },
        context: 'Critical for long-term success.'
      },
      'CAC Payback (months)': {
        p25: 16, p50: 11, p75: 7, p90: 4,
        description: 'Months to recover customer acquisition cost',
        icon: BarChart3,
        recommendations: {
          below: 'Improve unit economics',
          average: 'Acceptable payback',
          good: 'Efficient economics',
          exceptional: 'Outstanding efficiency'
        },
        context: 'Should improve with scale.'
      },
      'Viral Coefficient': {
        p25: 0.4, p50: 0.6, p75: 0.9, p90: 1.3,
        description: 'Average invites per user that convert',
        icon: Zap,
        recommendations: {
          below: 'Improve referral incentives',
          average: 'Good viral mechanics',
          good: 'Strong organic growth',
          exceptional: 'Self-sustaining growth'
        },
        context: 'Virality reduces CAC significantly.'
      }
    },
    'Series B+': {
      'User Growth Rate (%)': {
        p25: 10, p50: 18, p75: 30, p90: 48,
        description: 'Month-over-month active user growth',
        icon: TrendingUp,
        recommendations: {
          below: 'Expand into new segments',
          average: 'Healthy at-scale growth',
          good: 'Strong growth at scale',
          exceptional: 'Rare at this scale'
        },
        context: 'Maintaining growth at scale is difficult.'
      },
      'Transaction Volume Growth (%)': {
        p25: 15, p50: 28, p75: 45, p90: 70,
        description: 'Growth in total transaction value',
        icon: DollarSign,
        recommendations: {
          below: 'Drive higher transaction values',
          average: 'Solid volume growth',
          good: 'Strong engagement',
          exceptional: 'Exceptional volume growth'
        },
        context: 'Should remain strong with scale.'
      },
      'Revenue per User ($)': {
        p25: 15, p50: 32, p75: 65, p90: 130,
        description: 'Average monthly revenue per active user',
        icon: Target,
        recommendations: {
          below: 'Launch premium tiers',
          average: 'Good monetization',
          good: 'Strong ARPU',
          exceptional: 'Premium monetization'
        },
        context: 'Can increase significantly at scale.'
      },
      'Retention Rate (%)': {
        p25: 65, p50: 75, p75: 84, p90: 92,
        description: 'Monthly active user retention',
        icon: Users,
        recommendations: {
          below: 'Address retention immediately',
          average: 'Healthy retention',
          good: 'Strong product stickiness',
          exceptional: 'World-class retention'
        },
        context: 'Essential for sustainable business.'
      },
      'CAC Payback (months)': {
        p25: 14, p50: 9, p75: 6, p90: 3,
        description: 'Months to recover customer acquisition cost',
        icon: BarChart3,
        recommendations: {
          below: 'Optimize acquisition',
          average: 'Good payback',
          good: 'Efficient at scale',
          exceptional: 'Best-in-class efficiency'
        },
        context: 'Efficiency should improve significantly.'
      },
      'Viral Coefficient': {
        p25: 0.5, p50: 0.7, p75: 1.0, p90: 1.4,
        description: 'Average invites per user that convert',
        icon: Zap,
        recommendations: {
          below: 'Strengthen network effects',
          average: 'Good organic growth',
          good: 'Strong viral mechanics',
          exceptional: 'Powerful network effects'
        },
        context: 'Virality becomes competitive moat.'
      }
    }
  }
};

const MetricBenchmarks = () => {
  const navigate = useNavigate();
  const [industry, setIndustry] = useState('SaaS');
  const [stage, setStage] = useState('Seed');
  const [metrics, setMetrics] = useState<Record<string, string>>({});

  const isInverseMetric = (metricName: string) => {
    return metricName.toLowerCase().includes('churn') || metricName.toLowerCase().includes('payback');
  };

  const getPerformanceLevel = (value: number, benchmark: BenchmarkData, metricName: string) => {
    const inverse = isInverseMetric(metricName);
    if (inverse) {
      if (value <= benchmark.p90) return { level: 'Exceptional', color: 'text-emerald-600', badgeVariant: 'default' as const };
      if (value <= benchmark.p75) return { level: 'Strong', color: 'text-cyan-600', badgeVariant: 'secondary' as const };
      if (value <= benchmark.p50) return { level: 'Average', color: 'text-yellow-600', badgeVariant: 'outline' as const };
      if (value <= benchmark.p25) return { level: 'Below Average', color: 'text-orange-600', badgeVariant: 'outline' as const };
      return { level: 'Needs Improvement', color: 'text-red-600', badgeVariant: 'destructive' as const };
    } else {
      if (value >= benchmark.p90) return { level: 'Exceptional', color: 'text-emerald-600', badgeVariant: 'default' as const };
      if (value >= benchmark.p75) return { level: 'Strong', color: 'text-cyan-600', badgeVariant: 'secondary' as const };
      if (value >= benchmark.p50) return { level: 'Average', color: 'text-yellow-600', badgeVariant: 'outline' as const };
      if (value >= benchmark.p25) return { level: 'Below Average', color: 'text-orange-600', badgeVariant: 'outline' as const };
      return { level: 'Needs Improvement', color: 'text-red-600', badgeVariant: 'destructive' as const };
    }
  };

  const getPercentile = (value: number, benchmark: BenchmarkData, metricName: string) => {
    const inverse = isInverseMetric(metricName);
    if (inverse) {
      if (value <= benchmark.p90) return 90 + (1 - value / benchmark.p90) * 10;
      if (value <= benchmark.p75) return 75 + ((benchmark.p75 - value) / (benchmark.p75 - benchmark.p90)) * 15;
      if (value <= benchmark.p50) return 50 + ((benchmark.p50 - value) / (benchmark.p50 - benchmark.p75)) * 25;
      if (value <= benchmark.p25) return 25 + ((benchmark.p25 - value) / (benchmark.p25 - benchmark.p50)) * 25;
      return Math.max(0, 25 - ((value - benchmark.p25) / benchmark.p25) * 25);
    } else {
      if (value >= benchmark.p90) return Math.min(100, 90 + ((value - benchmark.p90) / benchmark.p90) * 10);
      if (value >= benchmark.p75) return 75 + ((value - benchmark.p75) / (benchmark.p90 - benchmark.p75)) * 15;
      if (value >= benchmark.p50) return 50 + ((value - benchmark.p50) / (benchmark.p75 - benchmark.p50)) * 25;
      if (value >= benchmark.p25) return 25 + ((value - benchmark.p25) / (benchmark.p50 - benchmark.p25)) * 25;
      return (value / benchmark.p25) * 25;
    }
  };

  const getRecommendation = (percentile: number, recommendations: BenchmarkData['recommendations']) => {
    if (percentile >= 90) return recommendations.exceptional;
    if (percentile >= 75) return recommendations.good;
    if (percentile >= 50) return recommendations.average;
    return recommendations.below;
  };

  const currentBenchmarks = benchmarkData[industry]?.[stage] || {};
  const filledMetrics = Object.entries(metrics).filter(([_, value]) => value && value.trim() !== '');
  const totalMetrics = Object.keys(currentBenchmarks).length;
  const completionRate = (filledMetrics.length / totalMetrics) * 100;

  const overallScore = filledMetrics.length > 0 
    ? Math.round(
        filledMetrics.reduce((acc, [metricName, value]) => {
          const numValue = parseFloat(value);
          const benchmark = currentBenchmarks[metricName];
          if (benchmark) {
            return acc + getPercentile(numValue, benchmark, metricName);
          }
          return acc;
        }, 0) / filledMetrics.length
      )
    : 0;

  const getOverallStatus = () => {
    if (overallScore >= 75) return { text: 'Strong Performance', color: 'text-emerald-600', icon: Award };
    if (overallScore >= 50) return { text: 'Average Performance', color: 'text-yellow-600', icon: Target };
    return { text: 'Needs Improvement', color: 'text-orange-600', icon: AlertCircle };
  };

  const overallStatus = getOverallStatus();

  return (
    <AuthGuard>
      <div className="min-h-screen relative bg-background">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')} 
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-4 mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Performance Analysis</span>
              </div>
              <h1 className="text-5xl font-bold tracking-tight">
                Metric Benchmarks
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Compare your startup's performance against industry standards and get actionable recommendations
              </p>
            </div>

            {/* Executive Summary Banner - Shows when metrics are entered */}
            {filledMetrics.length > 0 && (
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-cyan-500/30">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <overallStatus.icon className={`w-8 h-8 ${overallStatus.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Overall Score: {overallScore}th Percentile
                    </h3>
                    <p className={`text-lg font-medium mb-3 ${overallStatus.color}`}>
                      {overallStatus.text}
                    </p>
                    <p className="text-white/80 leading-relaxed">
                      Based on {filledMetrics.length} of {totalMetrics} metrics entered ({Math.round(completionRate)}% complete), 
                      your {industry} startup at the {stage} stage is performing 
                      {overallScore >= 75 ? ' exceptionally well' : overallScore >= 50 ? ' at an average level' : ' below the median'}. 
                      {overallScore < 75 && ' Review the detailed recommendations below to improve your metrics.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Configuration Card */}
            <Card className="bg-white/95 backdrop-blur-sm border-2 border-white/20">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Target className="w-6 h-6 text-cyan-600" />
                  Configure Your Analysis
                </CardTitle>
                <CardDescription className="text-base">
                  Select your industry and funding stage, then enter your current metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Industry</Label>
                    <Select value={industry} onValueChange={(value) => {
                      setIndustry(value);
                      setMetrics({});
                    }}>
                      <SelectTrigger className="bg-white border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SaaS">SaaS</SelectItem>
                        <SelectItem value="Marketplace">Marketplace</SelectItem>
                        <SelectItem value="E-commerce">E-commerce</SelectItem>
                        <SelectItem value="FinTech">FinTech</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Funding Stage</Label>
                    <Select value={stage} onValueChange={(value) => {
                      setStage(value);
                      setMetrics({});
                    }}>
                      <SelectTrigger className="bg-white border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Seed">Seed</SelectItem>
                        <SelectItem value="Series A">Series A</SelectItem>
                        <SelectItem value="Series B+">Series B+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Enter Your Metrics</h3>
                    <Badge variant="outline" className="text-sm">
                      {filledMetrics.length} of {totalMetrics} completed
                    </Badge>
                  </div>
                  <Progress value={completionRate} className="h-2 mb-6" />
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(currentBenchmarks).map(([metricName, benchmark]) => {
                      const Icon = benchmark.icon;
                      return (
                        <div key={metricName} className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm font-medium">
                            <Icon className="w-4 h-4 text-cyan-600" />
                            {metricName}
                          </Label>
                          <Input
                            type="number"
                            step="any"
                            placeholder={`Enter ${metricName.toLowerCase()}`}
                            value={metrics[metricName] || ''}
                            onChange={(e) => setMetrics({ ...metrics, [metricName]: e.target.value })}
                            className="bg-white border-2"
                          />
                          <p className="text-xs text-muted-foreground">{benchmark.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analysis - Shows when metrics are entered */}
            {filledMetrics.length > 0 && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-white/10 p-1">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-white/90">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="detailed" className="data-[state=active]:bg-white/90">
                    Detailed Analysis
                  </TabsTrigger>
                  <TabsTrigger value="context" className="data-[state=active]:bg-white/90">
                    Context & Tips
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-6">
                  {filledMetrics.map(([metricName, value]) => {
                    const numValue = parseFloat(value);
                    const benchmark = currentBenchmarks[metricName];
                    if (!benchmark) return null;
                    
                    const performance = getPerformanceLevel(numValue, benchmark, metricName);
                    const percentile = getPercentile(numValue, benchmark, metricName);
                    const Icon = benchmark.icon;

                    return (
                      <Card key={metricName} className="bg-white/95 backdrop-blur-sm border-2 border-dashed border-white/30">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-500/10 rounded-lg">
                                  <Icon className="w-5 h-5 text-cyan-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">{metricName}</h3>
                                  <p className="text-sm text-muted-foreground">{benchmark.description}</p>
                                </div>
                              </div>
                              <Badge variant={performance.badgeVariant} className="text-sm">
                                {performance.level}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-5 gap-2 text-center text-sm">
                              <div className="p-2 rounded bg-red-50">
                                <div className="font-semibold text-red-700">P25</div>
                                <div className="text-xs text-muted-foreground">{benchmark.p25}</div>
                              </div>
                              <div className="p-2 rounded bg-yellow-50">
                                <div className="font-semibold text-yellow-700">P50</div>
                                <div className="text-xs text-muted-foreground">{benchmark.p50}</div>
                              </div>
                              <div className="p-2 rounded bg-blue-50">
                                <div className="font-semibold text-blue-700">P75</div>
                                <div className="text-xs text-muted-foreground">{benchmark.p75}</div>
                              </div>
                              <div className="p-2 rounded bg-green-50">
                                <div className="font-semibold text-green-700">P90</div>
                                <div className="text-xs text-muted-foreground">{benchmark.p90}</div>
                              </div>
                              <div className="p-2 rounded bg-cyan-50 ring-2 ring-cyan-500">
                                <div className="font-semibold text-cyan-700">You</div>
                                <div className="text-xs font-medium text-cyan-700">{numValue}</div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Your Position</span>
                                <span className={`font-semibold ${performance.color}`}>
                                  {Math.round(percentile)}th Percentile
                                </span>
                              </div>
                              <Progress value={Math.min(percentile, 100)} className="h-3" />
                            </div>

                            <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border-l-4 border-cyan-500">
                              <div className="flex items-start gap-2">
                                <ArrowRight className="w-5 h-5 text-cyan-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm leading-relaxed text-slate-700">
                                  {getRecommendation(percentile, benchmark.recommendations)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>

                {/* Detailed Analysis Tab */}
                <TabsContent value="detailed" className="mt-6">
                  <Card className="bg-white/95 backdrop-blur-sm border-2 border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-cyan-600" />
                        Metric-by-Metric Breakdown
                      </CardTitle>
                      <CardDescription>
                        Deep dive into each metric with full context and recommendations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="w-full">
                        {filledMetrics.map(([metricName, value], index) => {
                          const numValue = parseFloat(value);
                          const benchmark = currentBenchmarks[metricName];
                          if (!benchmark) return null;
                          
                          const performance = getPerformanceLevel(numValue, benchmark, metricName);
                          const percentile = getPercentile(numValue, benchmark, metricName);
                          const Icon = benchmark.icon;

                          return (
                            <AccordionItem key={metricName} value={`item-${index}`}>
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-4 text-left w-full">
                                  <div className="p-2 bg-cyan-500/10 rounded-lg">
                                    <Icon className="w-5 h-5 text-cyan-600" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-semibold">{metricName}</div>
                                    <div className="text-sm text-muted-foreground">{benchmark.description}</div>
                                  </div>
                                  <Badge variant={performance.badgeVariant}>{performance.level}</Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-4 space-y-6">
                                <div className="pl-16">
                                  <div className="space-y-6">
                                    {/* Your Performance */}
                                    <div>
                                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Target className="w-4 h-4" />
                                        Your Performance
                                      </h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-50 rounded-lg">
                                          <div className="text-sm text-muted-foreground mb-1">Your Value</div>
                                          <div className="text-2xl font-bold text-cyan-600">{numValue}</div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-lg">
                                          <div className="text-sm text-muted-foreground mb-1">Percentile Rank</div>
                                          <div className={`text-2xl font-bold ${performance.color}`}>
                                            {Math.round(percentile)}th
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Industry Benchmarks */}
                                    <div>
                                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4" />
                                        Industry Benchmarks ({industry} - {stage})
                                      </h4>
                                      <div className="space-y-2">
                                        {[
                                          { label: 'Top 10% (P90)', value: benchmark.p90, color: 'bg-green-500' },
                                          { label: 'Top 25% (P75)', value: benchmark.p75, color: 'bg-blue-500' },
                                          { label: 'Median (P50)', value: benchmark.p50, color: 'bg-yellow-500' },
                                          { label: 'Bottom 25% (P25)', value: benchmark.p25, color: 'bg-orange-500' }
                                        ].map((item) => (
                                          <div key={item.label} className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                            <div className="flex-1 flex justify-between">
                                              <span className="text-sm">{item.label}</span>
                                              <span className="text-sm font-semibold">{item.value}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Recommendations by Performance Level */}
                                    <div>
                                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Zap className="w-4 h-4" />
                                        Targeted Recommendations
                                      </h4>
                                      <div className="space-y-3">
                                        <div className="p-4 bg-cyan-50 rounded-lg border-l-4 border-cyan-500">
                                          <div className="font-medium text-sm text-cyan-900 mb-2">
                                            For Your Performance Level:
                                          </div>
                                          <p className="text-sm text-cyan-800 leading-relaxed">
                                            {getRecommendation(percentile, benchmark.recommendations)}
                                          </p>
                                        </div>
                                        
                                        {percentile < 75 && (
                                          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                            <div className="font-medium text-sm text-blue-900 mb-2">
                                              To Reach Top Quartile (P75):
                                            </div>
                                            <p className="text-sm text-blue-800 leading-relaxed">
                                              {benchmark.recommendations.good}
                                            </p>
                                          </div>
                                        )}
                                        
                                        {percentile < 90 && (
                                          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                                            <div className="font-medium text-sm text-green-900 mb-2">
                                              To Reach Top 10% (P90):
                                            </div>
                                            <p className="text-sm text-green-800 leading-relaxed">
                                              {benchmark.recommendations.exceptional}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Context */}
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <Info className="w-4 h-4" />
                                        Context
                                      </h4>
                                      <p className="text-sm text-slate-700 leading-relaxed">
                                        {benchmark.context}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Context & Tips Tab */}
                <TabsContent value="context" className="mt-6">
                  <Card className="bg-white/95 backdrop-blur-sm border-2 border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="w-6 h-6 text-cyan-600" />
                        Understanding {industry} Metrics at {stage} Stage
                      </CardTitle>
                      <CardDescription>
                        Key insights and context for interpreting your benchmarks
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {Object.entries(currentBenchmarks).map(([metricName, benchmark]) => (
                        <div key={metricName} className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/10 rounded-lg">
                              {<benchmark.icon className="w-5 h-5 text-cyan-600" />}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{metricName}</h3>
                              <p className="text-sm text-muted-foreground">{benchmark.description}</p>
                            </div>
                          </div>
                          <div className="pl-14">
                            <div className="p-4 bg-slate-50 rounded-lg">
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {benchmark.context}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="pt-6 border-t">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-cyan-600" />
                          General Tips for {stage} Stage {industry} Companies
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-4 bg-cyan-50 rounded-lg border-l-4 border-cyan-500">
                            <h4 className="font-medium mb-2">Focus Areas</h4>
                            <ul className="text-sm space-y-1 text-slate-700">
                              {stage === 'Seed' && (
                                <>
                                  <li>• Validate product-market fit</li>
                                  <li>• Find repeatable acquisition channels</li>
                                  <li>• Prioritize learning over perfection</li>
                                </>
                              )}
                              {stage === 'Series A' && (
                                <>
                                  <li>• Scale proven channels</li>
                                  <li>• Build operational systems</li>
                                  <li>• Optimize unit economics</li>
                                </>
                              )}
                              {stage === 'Series B+' && (
                                <>
                                  <li>• Maintain growth at scale</li>
                                  <li>• Expand into new markets</li>
                                  <li>• Build sustainable advantages</li>
                                </>
                              )}
                            </ul>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                            <h4 className="font-medium mb-2">Common Pitfalls</h4>
                            <ul className="text-sm space-y-1 text-slate-700">
                              {stage === 'Seed' && (
                                <>
                                  <li>• Scaling before product-market fit</li>
                                  <li>• Ignoring unit economics</li>
                                  <li>• Over-optimizing too early</li>
                                </>
                              )}
                              {stage === 'Series A' && (
                                <>
                                  <li>• Growing without sustainable economics</li>
                                  <li>• Neglecting customer success</li>
                                  <li>• Hiring too fast or too slow</li>
                                </>
                              )}
                              {stage === 'Series B+' && (
                                <>
                                  <li>• Losing focus on core business</li>
                                  <li>• Over-diversifying too quickly</li>
                                  <li>• Ignoring changing market dynamics</li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {/* Empty State */}
            {filledMetrics.length === 0 && (
              <Card className="bg-white/95 backdrop-blur-sm border-2 border-dashed border-white/30">
                <CardContent className="p-12 text-center">
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto">
                      <BarChart3 className="w-8 h-8 text-cyan-600" />
                    </div>
                    <h3 className="text-xl font-semibold">Ready to See How You Compare?</h3>
                    <p className="text-muted-foreground">
                      Enter your metrics above to see detailed benchmarks, personalized recommendations, and understand where you stand in your industry.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default MetricBenchmarks;
