import random
from datetime import datetime, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.authentication.models import StaffProfile
from apps.inventory.models import Category, Supplier, Product, Asset
from apps.customers.models import Customer
from apps.rentals.models import Rental, RentalItem, RentalStatusHistory, DispatchRecord, ReturnRecord, DamageInspection
from apps.billing.models import Payment, LedgerEntry, SecurityDeposit
from apps.maintenance.models import MaintenanceRecord
from apps.notifications.models import Notification

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds realistic demonstration data for Equipment & Tool Rental CRM'

    def handle(self, *args, **options):
        self.stdout.write("Starting realistic data seeding...")

        # 1. Staff & Admin Users
        self.stdout.write("Creating users & staff...")
        admin_user, _ = User.objects.get_or_create(
            email='admin@rentalcrm.com',
            defaults={
                'username': 'admin',
                'first_name': 'Super',
                'last_name': 'Administrator',
                'role': 'admin',
                'phone': '+91 98100 12345',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True
            }
        )
        admin_user.set_password('Admin@123')
        admin_user.save()
        StaffProfile.objects.get_or_create(
            user=admin_user,
            defaults={'employee_id': 'EMP-0001', 'department': 'Executive Management', 'address': 'New Delhi HQ'}
        )

        front_staff, _ = User.objects.get_or_create(
            email='staff@rentalcrm.com',
            defaults={
                'username': 'staff',
                'first_name': 'Aarav',
                'last_name': 'Mehta',
                'role': 'front_desk',
                'phone': '+91 98200 23456',
                'is_active': True
            }
        )
        front_staff.set_password('Staff@123')
        front_staff.save()
        StaffProfile.objects.get_or_create(
            user=front_staff,
            defaults={'employee_id': 'EMP-0002', 'department': 'Front Desk & Bookings', 'address': 'Connaught Place Branch'}
        )

        staff_list_data = [
            ('rajesh.kumar@rentalcrm.com', 'Rajesh', 'Kumar', 'operations', 'EMP-0003', 'Operations & Yard', '+91 98300 34567'),
            ('priya.sharma@rentalcrm.com', 'Priya', 'Sharma', 'front_desk', 'EMP-0004', 'Front Desk', '+91 98400 45678'),
            ('vikram.singh@rentalcrm.com', 'Vikram', 'Singh', 'operations', 'EMP-0005', 'Maintenance & Workshop', '+91 98500 56789'),
            ('anita.deshmukh@rentalcrm.com', 'Anita', 'Deshmukh', 'front_desk', 'EMP-0006', 'Customer Accounts', '+91 98600 67890'),
        ]
        created_staff = [admin_user, front_staff]
        for email, fn, ln, role, emp_id, dept, phone in staff_list_data:
            u, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': fn,
                    'last_name': ln,
                    'role': role,
                    'phone': phone,
                    'is_active': True
                }
            )
            u.set_password('Staff@123')
            u.save()
            StaffProfile.objects.get_or_create(
                user=u,
                defaults={'employee_id': emp_id, 'department': dept, 'address': 'Main Depot, Industrial Area'}
            )
            created_staff.append(u)

        # 2. Categories (9 categories)
        self.stdout.write("Creating categories...")
        categories_data = [
            ('Earthmoving & Excavation', 'earthmoving-excavation', 'Heavy construction machinery and excavators', 'Truck'),
            ('Concrete & Compaction', 'concrete-compaction', 'Concrete mixers, vibrators, and plate compactors', 'Boxes'),
            ('Power & Generators', 'power-generators', 'Diesel and silent inverter portable generators', 'Zap'),
            ('Drilling & Demolition', 'drilling-demolition', 'Rotary hammers, core drills, and demolition breakers', 'Hammer'),
            ('Cutting & Power Saws', 'cutting-power-saws', 'Circular saws, concrete cutters, and tile saws', 'Scissors'),
            ('Welding & Fabrication', 'welding-fabrication', 'TIG, MIG, and ARC industrial welding equipment', 'Flame'),
            ('Cleaning & Pressure Washers', 'cleaning-pressure-washers', 'Commercial high-pressure washers and industrial vacuums', 'Droplets'),
            ('Access & Scaffolding', 'access-scaffolding', 'Aluminium extension ladders, mobile scaffolds, and boom lifts', 'Layers'),
            ('Material Handling', 'material-handling', 'Pallet trucks, chain pulley blocks, and electric hoists', 'Package'),
        ]
        category_objs = {}
        for name, slug, desc, icon in categories_data:
            cat, _ = Category.objects.get_or_create(
                slug=slug,
                defaults={'name': name, 'description': desc, 'icon': icon}
            )
            category_objs[slug] = cat

        # 3. Suppliers (6 suppliers)
        self.stdout.write("Creating suppliers...")
        suppliers_data = [
            ('JCB India Equipment Ltd', 'Sanjay Verma', '+91 129 4299000', 'equipment@jcbindia.com', 'Ballabgarh, Haryana'),
            ('Bosch Power Tools India', 'Rohan Gupta', '+91 80 67022000', 'rentals@in.bosch.com', 'Electronic City, Bengaluru'),
            ('Kirloskar Oil Engines', 'Mahesh Patil', '+91 20 25810341', 'powergens@kirloskar.com', 'Khadki, Pune'),
            ('ESAB Welding Systems India', 'Amit Banerjee', '+91 44 42281100', 'orders@esabindia.com', 'Ambattur, Chennai'),
            ('Kärcher India Cleaning Systems', 'Sunil Nair', '+91 120 7111800', 'commercial@karcher.in', 'Noida, Uttar Pradesh'),
            ('Godrej Material Handling', 'Devendra Joshi', '+91 22 67961700', 'mhe@godrej.com', 'Vikhroli, Mumbai'),
        ]
        supplier_objs = []
        for name, cp, phone, email, addr in suppliers_data:
            sup, _ = Supplier.objects.get_or_create(
                name=name,
                defaults={
                    'contact_person': cp,
                    'phone_number': phone,
                    'email': email,
                    'address': addr,
                    'company_details': f'Authorized OEM and spare parts vendor for {name}.'
                }
            )
            supplier_objs.append(sup)

        # 4. Products (22 products)
        self.stdout.write("Creating products...")
        products_data = [
            # Earthmoving
            ('Mini Hydraulic Excavator 3T', 'PRD-EXC-01', 'earthmoving-excavation', 'JCB', '19C-1', 
             'Compact 3-ton hydraulic mini excavator with rubber tracks for urban utilities and trenching.',
             'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=500&auto=format&fit=crop',
             3500.0, 21000.0, 75000.0, 20000.0, 1500.0),
            ('Plate Compactor 90kg', 'PRD-CMP-01', 'concrete-compaction', 'Wacker Neuson', 'WP1550',
             'Heavy-duty vibratory plate compactor for asphalt and granular soil compaction.',
             'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop',
             650.0, 3900.0, 14000.0, 3000.0, 250.0),
            ('Portable Concrete Mixer 10/7 CFT', 'PRD-MIX-01', 'concrete-compaction', 'Safari India', 'SM-107',
             'Diesel engine driven mobile concrete mixer with hydraulic hopper.',
             'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=500&auto=format&fit=crop',
             1200.0, 7200.0, 25000.0, 6000.0, 450.0),
            ('Silent Diesel Generator 15 kVA', 'PRD-GEN-15', 'power-generators', 'Kirloskar', 'KG1-15AS',
             'Soundproof silent canopy diesel generator set for continuous site power backup.',
             'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=500&auto=format&fit=crop',
             1800.0, 10800.0, 38000.0, 10000.0, 750.0),
            ('Silent Inverter Generator 3 kVA', 'PRD-GEN-03', 'power-generators', 'Honda', 'EU30is',
             'Ultra-quiet portable inverter generator suitable for sensitive electronic gear and mobile work.',
             'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop',
             800.0, 4800.0, 16000.0, 4000.0, 300.0),
            ('Demolition Breaker 16kg', 'PRD-BRK-16', 'drilling-demolition', 'Bosch', 'GSH 16-30',
             'Extreme 41 Joules impact demolition hammer for reinforced concrete floor breakout.',
             'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500&auto=format&fit=crop',
             900.0, 5400.0, 18000.0, 5000.0, 350.0),
            ('Rotary Hammer Drill SDS-Max', 'PRD-DRL-02', 'drilling-demolition', 'Hilti', 'TE 70-ATC',
             'High performance heavy-duty combihammer for anchor hole drilling and chiseling.',
             'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=500&auto=format&fit=crop',
             550.0, 3300.0, 11000.0, 3000.0, 200.0),
            ('Diamond Core Drilling Machine 200mm', 'PRD-COR-01', 'drilling-demolition', 'Bosch', 'GDB 350 WE',
             'Wet core drilling rig with stand for plumbing and AC pipe penetrations.',
             'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop',
             1100.0, 6600.0, 22000.0, 6000.0, 400.0),
            ('Concrete Saw / Floor Saw 16 inch', 'PRD-SAW-16', 'cutting-power-saws', 'Husqvarna', 'FS 400 LV',
             'Push floor saw with adjustable handle for road expansion joint cutting.',
             'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&auto=format&fit=crop',
             1300.0, 7800.0, 26000.0, 7000.0, 500.0),
            ('Cut-Off Machine / Metal Chopsaw 14 inch', 'PRD-CUT-14', 'cutting-power-saws', 'Makita', 'LW1400',
             'Heavy-duty abrasive cut-off saw for steel rebars, tubes, and angles.',
             'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=500&auto=format&fit=crop',
             400.0, 2400.0, 8000.0, 2000.0, 150.0),
            ('ARC / MMA Inverter Welder 400A', 'PRD-WLD-400', 'welding-fabrication', 'ESAB', 'Buddy Arc 400i',
             'Industrial 3-phase heavy duty inverter MMA welding power source.',
             'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=500&auto=format&fit=crop',
             700.0, 4200.0, 15000.0, 4000.0, 250.0),
            ('MIG/MAG Semi-Automatic Welder 300A', 'PRD-MIG-300', 'welding-fabrication', 'Ador Welding', 'Champ Pulse 300',
             'High precision CO2 / Argon shielding wire feed welding unit.',
             'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop',
             950.0, 5700.0, 20000.0, 5000.0, 350.0),
            ('Commercial High Pressure Washer 200 Bar', 'PRD-WSH-200', 'cleaning-pressure-washers', 'Kärcher', 'HD 9/20-4 M',
             'Cold water commercial pressure washer for building facades and machinery degreasing.',
             'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=500&auto=format&fit=crop',
             850.0, 5100.0, 17000.0, 4500.0, 300.0),
            ('Industrial Wet & Dry Vacuum Cleaner 70L', 'PRD-VAC-70', 'cleaning-pressure-washers', 'Eureka Forbes', 'Pro Vac 70',
             'Twin motor high suction stainless steel drum vacuum for slurry and debris.',
             'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=500&auto=format&fit=crop',
             450.0, 2700.0, 9000.0, 2500.0, 150.0),
            ('Aluminium Extension Ladder 24 ft', 'PRD-LAD-24', 'access-scaffolding', 'Youngman', 'Pro-Ext 24',
             'Heavy duty non-conductive rung lock telescopic extension ladder.',
             'https://images.unsplash.com/photo-1516216628859-9bcceabb83ca?w=500&auto=format&fit=crop',
             300.0, 1800.0, 6000.0, 1500.0, 100.0),
            ('Mobile Aluminium Scaffolding Tower 6m', 'PRD-SCF-06', 'access-scaffolding', 'Instant UpRight', 'Span 400',
             'Quick-erect mobile modular tower with caster wheels and safety trapdoors.',
             'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=500&auto=format&fit=crop',
             1500.0, 9000.0, 30000.0, 8000.0, 500.0),
            ('Manual Hydraulic Pallet Truck 2.5T', 'PRD-PLT-25', 'material-handling', 'Godrej', 'GPT-2500',
             'Tandem polyurethane roller hand pallet truck with 1150mm forks.',
             'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop',
             400.0, 2400.0, 8000.0, 2500.0, 150.0),
            ('Chain Pulley Block 3T / 6m Lift', 'PRD-CHN-03', 'material-handling', 'Indef', 'Model M 3T',
             'Heavy duty spur gear chain hoist with grade 80 load chain.',
             'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop',
             350.0, 2100.0, 7000.0, 2000.0, 120.0),
            ('Concrete Needle Vibrator 2HP', 'PRD-VIB-02', 'concrete-compaction', 'Crompton', 'NV-60',
             'Single phase high-frequency needle poker vibrator for air bubble release.',
             'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop',
             350.0, 2100.0, 7000.0, 1800.0, 120.0),
            ('Electric Demolition Jackhammer 30kg', 'PRD-JKH-30', 'drilling-demolition', 'Makita', 'HM1812',
             'AVT anti-vibration heavyweight road and foundation pavement breaker.',
             'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500&auto=format&fit=crop',
             1200.0, 7200.0, 24000.0, 7000.0, 400.0),
            ('Gasoline Water Trash Pump 3 inch', 'PRD-PMP-03', 'cleaning-pressure-washers', 'Honda', 'WT30XK4',
             'Solids handling high discharge centrifugal dewatering pump for muddy excavations.',
             'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop',
             750.0, 4500.0, 15000.0, 4000.0, 250.0),
            ('Magnetic Base Core Drill Machine', 'PRD-MAG-01', 'drilling-demolition', 'BDS Maschinen', 'MAB 485',
             'Magnetic clamping drill for fabrication steel girder hole broaching.',
             'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=500&auto=format&fit=crop',
             800.0, 4800.0, 16000.0, 4500.0, 300.0),
        ]

        product_objs = []
        for name, code, c_slug, brand, model, desc, img, d_rate, w_rate, m_rate, dep, l_fee in products_data:
            p, _ = Product.objects.get_or_create(
                product_code=code,
                defaults={
                    'name': name,
                    'category': category_objs[c_slug],
                    'brand': brand,
                    'model': model,
                    'description': desc,
                    'image_url': img,
                    'daily_rental_rate': Decimal(str(d_rate)),
                    'weekly_rental_rate': Decimal(str(w_rate)),
                    'monthly_rental_rate': Decimal(str(m_rate)),
                    'security_deposit': Decimal(str(dep)),
                    'late_fee_per_day': Decimal(str(l_fee)),
                    'default_rental_duration': 3,
                    'status': 'active'
                }
            )
            product_objs.append(p)

        # 5. Assets (45+ physical assets)
        self.stdout.write("Creating physical assets with unique serial numbers...")
        locations = [
            'Depot Central - Bay A1', 'Depot Central - Bay A2', 'Depot Central - Bay B1',
            'Depot North - Heavy Yard', 'Tool Crib Rack 3', 'Tool Crib Rack 5',
            'Workshop Inspection Area', 'Storage Bay D'
        ]

        asset_objs = []
        asset_counter = 100
        for p in product_objs:
            # Create 2 to 3 assets per product
            qty = 2 if 'Excavator' in p.name or '15 kVA' in p.name else 3
            for i in range(1, qty + 1):
                asset_counter += 1
                s_num = f"SN-{p.brand.upper()[:4]}-{random.randint(10000, 99999)}"
                ast_id = f"AST-{asset_counter:04d}"
                sup = random.choice(supplier_objs)
                p_cost = p.daily_rental_rate * Decimal('50.00')

                asset, _ = Asset.objects.get_or_create(
                    asset_id=ast_id,
                    defaults={
                        'product': p,
                        'serial_number': s_num,
                        'supplier': sup,
                        'purchase_date': timezone.now().date() - timedelta(days=random.randint(60, 400)),
                        'purchase_cost': p_cost,
                        'current_condition': 'Excellent' if i == 1 else 'Good',
                        'availability_status': 'Available',
                        'location': random.choice(locations),
                        'notes': f'Purchased from {sup.name} with standard factory warranty.'
                    }
                )
                asset_objs.append(asset)

        # 6. Customers (16 customers)
        self.stdout.write("Creating realistic customers...")
        customers_data = [
            ('Larsen Infra Projects Pvt Ltd', '+91 98111 22334', 'procurement@larsengroup.in', 'Barakhamba Road, New Delhi', 'Company GSTIN', '07AAACL1234F1Z1'),
            ('Oberoi Contracting Services', '+91 98222 33445', 'contracts@oberoi-infra.com', 'Sector 44, Gurugram, Haryana', 'Company GSTIN', '06AAAFO5678B1Z8'),
            ('Rajesh Construction Co.', '+91 98333 44556', 'rajesh.builder@gmail.com', 'Ring Road, Lajpat Nagar, Delhi', 'PAN Card', 'ABCDE1234F'),
            ('Amitabh Saxena', '+91 98444 55667', 'asaxena.civils@yahoo.co.in', 'Civil Lines, Jaipur, Rajasthan', 'Aadhaar Card', '4589 1234 9876'),
            ('Tata BlueStar HVAC Engineering', '+91 98555 66778', 'hvac.rentals@tatabluestar.com', 'Okhla Industrial Area, Phase 1', 'Company GSTIN', '07AAACT9988D1ZQ'),
            ('Shree Ganesh Fabrication Works', '+91 98666 77889', 'ganeshfab@rediffmail.com', 'Mayapuri Industrial Area, Delhi', 'PAN Card', 'BKRPK7788L'),
            ('Pooja Electrical & Power Infra', '+91 98777 88990', 'pooja.power@gmail.com', 'Sector 18, Noida, Uttar Pradesh', 'Driving License', 'DL-0420180098765'),
            ('Vikas Aggarwal & Sons', '+91 98888 99001', 'vikas.aggarwal@hotmail.com', 'Model Town, Panipat, Haryana', 'Aadhaar Card', '6543 9876 1234'),
            ('Urban Space Interior Contractors', '+91 98999 11223', 'interiors@urbanspace.co.in', 'Golf Course Ext Road, Gurugram', 'Company GSTIN', '06AABCU4455M1Z9'),
            ('Kunal Deshmukh Builders', '+91 97111 22334', 'kunal.deshmukh@gmail.com', 'MG Road, Indore, Madhya Pradesh', 'Aadhaar Card', '7890 2345 6789'),
            ('Apex Roadways & Utilities', '+91 97222 33445', 'apex.utilities@apexgroup.org', 'Transport Nagar, Agra, UP', 'Company GSTIN', '09AAAFA8899N1Z2'),
            ('Manish Verma (Civils)', '+91 97333 44556', 'manish.v.contractor@gmail.com', 'South Ext, Part 2, New Delhi', 'Voter ID', 'DLV9876543'),
            ('Surya Power Grid Solutions', '+91 97444 55667', 'grid.rentals@suryapower.com', 'Nehru Place, New Delhi', 'Company GSTIN', '07AAACS1122K1Z4'),
            ('Balaji Earthmovers', '+91 97555 66778', 'balaji.earthworks@gmail.com', 'Kundli Industrial Zone, Sonipat', 'Driving License', 'HR-1020190012345'),
            ('Simplex Foundation Technologies', '+91 97666 77889', 'plant.hire@simplexfoundations.in', 'Connaught Circus, New Delhi', 'Company GSTIN', '07AAACS4321R1ZW'),
            ('Deepak Rawat (Plumbing & HVAC)', '+91 97777 88990', 'deepak.rawat@yahoo.com', 'Indirapuram, Ghaziabad, UP', 'Aadhaar Card', '9988 7766 5544'),
        ]

        customer_objs = []
        for fn, ph, em, addr, id_t, id_n in customers_data:
            c, _ = Customer.objects.get_or_create(
                phone_number=ph,
                defaults={
                    'full_name': fn,
                    'email': em,
                    'address': addr,
                    'id_proof_type': id_t,
                    'id_proof_number': id_n,
                    'notes': 'Verified client with KYC verification complete.'
                }
            )
            customer_objs.append(c)

        # 7. Seed Rentals (Active, Overdue, Returned, Reserved, Partially Returned)
        self.stdout.write("Creating rentals with realistic lifecycles...")
        today = timezone.now().date()
        used_assets = set()

        def pick_available_asset():
            for a in asset_objs:
                if a.id not in used_assets and a.availability_status == 'Available':
                    used_assets.add(a.id)
                    return a
            return random.choice(asset_objs)

        # A. Overdue Rentals (2 rentals)
        for i in range(1, 3):
            c = customer_objs[i - 1]
            ast1 = pick_available_asset()
            ast2 = pick_available_asset()
            start_d = today - timedelta(days=12 + i)
            exp_ret_d = today - timedelta(days=2 + i) # strictly in past -> Overdue!
            dur = (exp_ret_d - start_d).days

            charges = (ast1.product.daily_rental_rate + ast2.product.daily_rental_rate) * Decimal(dur)
            deposit = ast1.product.security_deposit + ast2.product.security_deposit
            tax = round(charges * Decimal('0.18'), 2)
            tot = charges + tax
            adv_pay = round(tot * Decimal('0.5'), 2)

            r_id = f"RNT-2026-00{i:02d}"
            rental, _ = Rental.objects.get_or_create(
                rental_id=r_id,
                defaults={
                    'customer': c,
                    'rental_start_date': start_d,
                    'expected_return_date': exp_ret_d,
                    'rental_duration': dur,
                    'rental_charges': charges,
                    'security_deposit': deposit,
                    'discount': Decimal('0.00'),
                    'tax': tax,
                    'total_amount': tot,
                    'paid_amount': adv_pay,
                    'outstanding_balance': tot - adv_pay,
                    'rental_status': 'Overdue',
                    'staff_responsible': random.choice(created_staff),
                    'notes': f'OVERDUE ALERT: Equipment due for return on {exp_ret_d}. Follow-up call logged.'
                }
            )
            for ast in [ast1, ast2]:
                RentalItem.objects.get_or_create(
                    rental=rental,
                    asset=ast,
                    defaults={
                        'product': ast.product,
                        'daily_rate_applied': ast.product.daily_rental_rate,
                        'deposit_applied': ast.product.security_deposit,
                        'item_status': 'Dispatched',
                        'condition_on_dispatch': ast.current_condition,
                        'dispatched_at': timezone.now() - timedelta(days=12)
                    }
                )
                ast.availability_status = 'Rented'
                ast.save()

            SecurityDeposit.objects.get_or_create(
                rental=rental,
                defaults={'customer': c, 'total_collected': deposit, 'status': 'Held'}
            )
            # Advance Payment
            pay_id = f"PAY-2026-00{i:02d}"
            p, _ = Payment.objects.get_or_create(
                payment_id=pay_id,
                defaults={
                    'rental': rental,
                    'customer': c,
                    'payment_amount': adv_pay,
                    'payment_method': 'UPI',
                    'payment_type': 'Rental Payment',
                    'payment_status': 'Completed',
                    'recorded_by': rental.staff_responsible,
                    'transaction_reference': f'UPI-RR-889922{i}'
                }
            )
            LedgerEntry.objects.get_or_create(
                entry_number=f"LED-2026-00{i:03d}",
                defaults={
                    'entry_type': 'Credit',
                    'category': 'Rental Revenue',
                    'amount': adv_pay,
                    'description': f'Advance collection for overdue rental {rental.rental_id}',
                    'payment': p,
                    'rental': rental,
                    'customer': c
                }
            )
            # Dispatch record
            DispatchRecord.objects.get_or_create(
                rental=rental,
                defaults={
                    'dispatched_by': rental.staff_responsible,
                    'accessories_provided': 'Connecting cables, heavy power lead, maintenance kit',
                    'customer_signature_name': c.full_name,
                    'initial_condition_notes': 'Checked oil levels and functional test done.'
                }
            )

        # B. Active Dispatched Rentals (4 rentals)
        for i in range(3, 7):
            c = customer_objs[i]
            ast1 = pick_available_asset()
            ast2 = pick_available_asset()
            start_d = today - timedelta(days=random.randint(1, 4))
            exp_ret_d = today + timedelta(days=random.randint(2, 8))
            dur = (exp_ret_d - start_d).days

            charges = (ast1.product.daily_rental_rate + ast2.product.daily_rental_rate) * Decimal(dur)
            deposit = ast1.product.security_deposit + ast2.product.security_deposit
            tax = round(charges * Decimal('0.18'), 2)
            tot = charges + tax
            adv_pay = tot # fully paid advance

            r_id = f"RNT-2026-00{i:02d}"
            rental, _ = Rental.objects.get_or_create(
                rental_id=r_id,
                defaults={
                    'customer': c,
                    'rental_start_date': start_d,
                    'expected_return_date': exp_ret_d,
                    'rental_duration': dur,
                    'rental_charges': charges,
                    'security_deposit': deposit,
                    'discount': Decimal('0.00'),
                    'tax': tax,
                    'total_amount': tot,
                    'paid_amount': adv_pay,
                    'outstanding_balance': Decimal('0.00'),
                    'rental_status': 'Dispatched',
                    'staff_responsible': random.choice(created_staff),
                    'notes': 'Active contract on-site.'
                }
            )
            for ast in [ast1, ast2]:
                RentalItem.objects.get_or_create(
                    rental=rental,
                    asset=ast,
                    defaults={
                        'product': ast.product,
                        'daily_rate_applied': ast.product.daily_rental_rate,
                        'deposit_applied': ast.product.security_deposit,
                        'item_status': 'Dispatched',
                        'condition_on_dispatch': 'Good',
                        'dispatched_at': timezone.now() - timedelta(days=2)
                    }
                )
                ast.availability_status = 'Rented'
                ast.save()

            SecurityDeposit.objects.get_or_create(
                rental=rental,
                defaults={'customer': c, 'total_collected': deposit, 'status': 'Held'}
            )
            pay_id = f"PAY-2026-00{i:02d}"
            p, _ = Payment.objects.get_or_create(
                payment_id=pay_id,
                defaults={
                    'rental': rental,
                    'customer': c,
                    'payment_amount': adv_pay,
                    'payment_method': 'Bank Transfer' if i % 2 == 0 else 'Card',
                    'payment_type': 'Rental Payment',
                    'payment_status': 'Completed',
                    'recorded_by': rental.staff_responsible,
                    'transaction_reference': f'NEFT-TXN-4455{i}'
                }
            )
            LedgerEntry.objects.get_or_create(
                entry_number=f"LED-2026-00{i:03d}",
                defaults={
                    'entry_type': 'Credit',
                    'category': 'Rental Revenue',
                    'amount': adv_pay,
                    'description': f'Full payment for rental {rental.rental_id}',
                    'payment': p,
                    'rental': rental,
                    'customer': c
                }
            )
            DispatchRecord.objects.get_or_create(
                rental=rental,
                defaults={
                    'dispatched_by': rental.staff_responsible,
                    'accessories_provided': 'Safety goggles, protective cover, operating manual',
                    'customer_signature_name': c.full_name,
                    'initial_condition_notes': 'All safety interlocks tested and verified.'
                }
            )

        # C. Completed Returned Rentals (4 rentals)
        for i in range(7, 11):
            c = customer_objs[i]
            ast1 = pick_available_asset()
            start_d = today - timedelta(days=20 + i)
            exp_ret_d = today - timedelta(days=10 + i)
            act_ret_d = exp_ret_d
            dur = (exp_ret_d - start_d).days

            charges = ast1.product.daily_rental_rate * Decimal(dur)
            deposit = ast1.product.security_deposit
            tax = round(charges * Decimal('0.18'), 2)
            tot = charges + tax

            r_id = f"RNT-2026-00{i:02d}"
            rental, _ = Rental.objects.get_or_create(
                rental_id=r_id,
                defaults={
                    'customer': c,
                    'rental_start_date': start_d,
                    'expected_return_date': exp_ret_d,
                    'actual_return_date': act_ret_d,
                    'rental_duration': dur,
                    'rental_charges': charges,
                    'security_deposit': deposit,
                    'discount': Decimal('100.00'),
                    'tax': tax,
                    'total_amount': tot - Decimal('100.00'),
                    'paid_amount': tot - Decimal('100.00'),
                    'outstanding_balance': Decimal('0.00'),
                    'rental_status': 'Returned',
                    'staff_responsible': random.choice(created_staff),
                    'notes': 'Successfully completed and returned without damages.'
                }
            )
            RentalItem.objects.get_or_create(
                rental=rental,
                asset=ast1,
                defaults={
                    'product': ast1.product,
                    'daily_rate_applied': ast1.product.daily_rental_rate,
                    'deposit_applied': ast1.product.security_deposit,
                    'item_status': 'Returned',
                    'condition_on_dispatch': 'Good',
                    'condition_on_return': 'Good',
                    'returned_at': timezone.now() - timedelta(days=10)
                }
            )
            ast1.availability_status = 'Available'
            ast1.save()

            ret_rec, _ = ReturnRecord.objects.get_or_create(
                rental=rental,
                defaults={'received_by': rental.staff_responsible, 'is_partial': False, 'notes': 'Full return completed.'}
            )
            DamageInspection.objects.get_or_create(
                rental=rental,
                asset=ast1,
                defaults={
                    'return_record': ret_rec,
                    'condition_before': 'Good',
                    'condition_after': 'Good',
                    'damage_description': 'Normal wear and tear. No physical damage.',
                    'damage_charges': Decimal('0.00'),
                    'refundable_deposit': deposit,
                    'inspected_by': rental.staff_responsible
                }
            )
            SecurityDeposit.objects.get_or_create(
                rental=rental,
                defaults={'customer': c, 'total_collected': deposit, 'total_refunded': deposit, 'status': 'Fully Refunded'}
            )
            # Payment record
            pay_id = f"PAY-2026-00{i:02d}"
            p, _ = Payment.objects.get_or_create(
                payment_id=pay_id,
                defaults={
                    'rental': rental,
                    'customer': c,
                    'payment_amount': tot - Decimal('100.00'),
                    'payment_method': 'Cash',
                    'payment_type': 'Rental Payment',
                    'payment_status': 'Completed',
                    'recorded_by': rental.staff_responsible
                }
            )
            LedgerEntry.objects.get_or_create(
                entry_number=f"LED-2026-00{i:03d}",
                defaults={
                    'entry_type': 'Credit',
                    'category': 'Rental Revenue',
                    'amount': tot - Decimal('100.00'),
                    'description': f'Full settlement for completed rental {rental.rental_id}',
                    'payment': p,
                    'rental': rental,
                    'customer': c
                }
            )

        # D. Reserved Future Bookings (3 bookings)
        for i in range(11, 14):
            c = customer_objs[i]
            ast1 = pick_available_asset()
            start_d = today + timedelta(days=i - 10)
            exp_ret_d = start_d + timedelta(days=4)
            dur = 4
            charges = ast1.product.daily_rental_rate * Decimal(dur)
            deposit = ast1.product.security_deposit
            tax = round(charges * Decimal('0.18'), 2)
            tot = charges + tax

            r_id = f"RNT-2026-00{i:02d}"
            rental, _ = Rental.objects.get_or_create(
                rental_id=r_id,
                defaults={
                    'customer': c,
                    'rental_start_date': start_d,
                    'expected_return_date': exp_ret_d,
                    'rental_duration': dur,
                    'rental_charges': charges,
                    'security_deposit': deposit,
                    'tax': tax,
                    'total_amount': tot,
                    'paid_amount': Decimal('0.00'),
                    'outstanding_balance': tot,
                    'rental_status': 'Reserved',
                    'staff_responsible': random.choice(created_staff),
                    'notes': f'Advance booking for project commencement on {start_d}.'
                }
            )
            RentalItem.objects.get_or_create(
                rental=rental,
                asset=ast1,
                defaults={
                    'product': ast1.product,
                    'daily_rate_applied': ast1.product.daily_rental_rate,
                    'deposit_applied': ast1.product.security_deposit,
                    'item_status': 'Reserved'
                }
            )
            ast1.availability_status = 'Reserved'
            ast1.save()

        # 8. Maintenance Records
        self.stdout.write("Creating maintenance records...")
        maintenance_assets = asset_objs[:4]
        m_types = ['Routine Inspection', 'Repair', 'Cleaning & Calibration', 'Parts Replacement']
        for idx, ast in enumerate(maintenance_assets):
            m_id = f"MNT-2026-00{idx+1:02d}"
            m_status = 'In Progress' if idx < 2 else 'Completed'
            cost = Decimal(str((idx + 1) * 750))
            m_rec, _ = MaintenanceRecord.objects.get_or_create(
                maintenance_id=m_id,
                defaults={
                    'asset': ast,
                    'maintenance_type': m_types[idx],
                    'issue_description': f'Scheduled servicing and component check for {ast.product.name}.',
                    'start_date': today - timedelta(days=5),
                    'expected_completion_date': today + timedelta(days=2),
                    'actual_completion_date': today - timedelta(days=1) if m_status == 'Completed' else None,
                    'maintenance_cost': cost,
                    'assigned_staff': random.choice(created_staff),
                    'status': m_status,
                    'resolution_notes': 'All worn O-rings replaced and lubricants refreshed.' if m_status == 'Completed' else 'In workshop.'
                }
            )
            if m_status == 'In Progress':
                ast.availability_status = 'Under Maintenance'
                ast.save()

        # 9. In-app Notifications
        self.stdout.write("Creating notifications...")
        notifications_data = [
            ("Overdue Rental Alert: RNT-2026-0001", "Rental RNT-2026-0001 for Larsen Infra is 3 days overdue. Please follow up.", "overdue", "/admin/rentals/1"),
            ("Upcoming Return Today: RNT-2026-0003", "Equipment for Oberoi Contracting is expected back at Depot Central today.", "return_due", "/admin/rentals/3"),
            ("Maintenance Required: MNT-2026-0001", "Asset SN-JCB-88201 is currently in progress for Routine Inspection.", "maintenance", "/admin/maintenance"),
            ("New Online Booking: RNT-2026-0011", "Advance reservation created for Tata BlueStar HVAC Engineering.", "new_booking", "/admin/rentals/11"),
            ("Low Stock Notice: Mini Excavators", "Only 1 Mini Hydraulic Excavator available for next week.", "low_stock", "/admin/assets"),
        ]
        for title, msg, n_type, link in notifications_data:
            Notification.objects.get_or_create(
                title=title,
                defaults={
                    'message': msg,
                    'notification_type': n_type,
                    'is_read': False,
                    'link': link
                }
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded comprehensive realistic demo data for Equipment & Tool Rental CRM!"))
